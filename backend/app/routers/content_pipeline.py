
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.role import Role
from app.routers.auth import get_current_user
from app.routers.translation import save_translation
from app.routers.review import ReviewRequest, run_review
from app.ai_service.service import generate_campaign_content
from app.ai_service.personalization_service import create_ai_variant
from app.ai_service.tone_service import analyze_tone


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/campaigns",
    tags=["Content Pipeline"],
)


class ContentPipelineRequest(BaseModel):
    language: Optional[str] = Field(default="en")
    target_segment: Optional[str] = Field(default=None)
    tone: Optional[str] = Field(default="professional")
    regenerate: bool = Field(default=False)


def utc_now():
    return datetime.now(timezone.utc)


def unique_strings(values):
    result = []
    seen = set()

    for value in values or []:
        if value is None:
            continue

        value = str(value).strip()

        if value and value not in seen:
            seen.add(value)
            result.append(value)

    return result


def stage_status(success=True, message="Completed", data=None):
    return {
        "status": "completed" if success else "failed",
        "message": message,
        "data": data or {},
    }


def get_user_role(db: Session, current_user) -> str:
    """
    Retrieve the actual role name using the user's role_id.
    """
    role = (
        db.query(Role)
        .filter(Role.id == current_user.role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=403,
            detail="Your account does not have a configured role.",
        )

    return role.name.strip().lower().replace("-", "_").replace(" ", "_")


def authorize_campaign_pipeline(
    db: Session,
    current_user,
    campaign: Campaign,
):
    """
    Permissions:
    - Admin: all campaigns.
    - Campaign Manager: campaigns they own.
    - Communication Team: campaigns they own.
    - Regular User: campaigns they own, if that role exists.
    """
    role = get_user_role(db, current_user)

    user_id = current_user.id
    campaign_owner_id = campaign.created_by

    admin_roles = {
        "admin",
        "administrator",
    }

    allowed_owner_roles = {
        "campaign_manager",
        "communication_team",
        "user",
        "regular_user",
        "regular",
    }

    # Admin can run pipelines for any campaign.
    if role in admin_roles:
        return

    # Other supported roles can run their own campaigns.
    if role in allowed_owner_roles and campaign_owner_id == user_id:
        return

    raise HTTPException(
        status_code=403,
        detail=(
            "You can run the content pipeline only for campaigns "
            "you own or are authorized to manage."
        ),
    )


def extract_content(result):
    """
    Extract text from common AI service response formats.
    """
    if isinstance(result, str):
        return result

    if isinstance(result, dict):
        for key in (
            "content",
            "text",
            "generated_content",
            "translated_text",
            "variant",
        ):
            value = result.get(key)

            if isinstance(value, str) and value.strip():
                return value

        return None

    for attribute in (
        "content",
        "text",
        "generated_content",
        "translated_text",
        "variant",
    ):
        value = getattr(result, attribute, None)

        if isinstance(value, str) and value.strip():
            return value

    return None


@router.post("/{campaign_id}/content/pipeline")
def run_content_pipeline(
    campaign_id: int,
    request: ContentPipelineRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Run the campaign content pipeline.

    Stages:
    1. Generate content.
    2. Translate content.
    3. Personalize content.
    4. Analyze tone.
    5. Review content.
    6. Determine approval readiness.
    """

    # ---------------------------------------------------------
    # 1. Retrieve campaign
    # ---------------------------------------------------------
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # ---------------------------------------------------------
    # 2. Authorization using the actual database role
    # ---------------------------------------------------------
    authorize_campaign_pipeline(
        db=db,
        current_user=current_user,
        campaign=campaign,
    )

    results = {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "pipeline_started_at": utc_now().isoformat(),
        "stages": {},
        "overall_status": "in_progress",
    }

    # ---------------------------------------------------------
    # 3. Generate content
    # ---------------------------------------------------------
    try:
        generated_result = generate_campaign_content(
            campaign=campaign,
            db=db,
        )

        generated_text = extract_content(generated_result)

        if not generated_text:
            raise ValueError(
                "The generation service returned no content."
            )

        results["stages"]["generate"] = stage_status(
            success=True,
            message="Campaign content generated successfully.",
        )

    except Exception as exc:
        logger.exception(
            "Generation failed for campaign %s",
            campaign_id,
        )

        results["stages"]["generate"] = stage_status(
            success=False,
            message=f"Content generation failed: {str(exc)}",
        )

        results["overall_status"] = "failed"
        results["pipeline_completed_at"] = utc_now().isoformat()

        return results

    # ---------------------------------------------------------
    # 4. Translate content
    # ---------------------------------------------------------
    language = (request.language or "en").strip()

    if language.lower() in {"en", "english"}:
        translated_text = generated_text

        results["stages"]["translate"] = stage_status(
            success=True,
            message="Translation skipped because the language is English.",
            data={"language": language},
        )

    else:
        try:
            translation_payload = {
                "text": generated_text,
                "target_language": language,
                "language": language,
            }

            try:
                translation_result = save_translation(
                    translation_payload,
                    db=db,
                    current_user=current_user,
                )
            except TypeError:
                translation_result = save_translation(
                    translation_payload,
                    db,
                )

            translated_text = extract_content(translation_result)

            if not translated_text:
                raise ValueError(
                    "The translation service returned no translated text."
                )

            results["stages"]["translate"] = stage_status(
                success=True,
                message="Translation completed successfully.",
                data={"language": language},
            )

        except Exception as exc:
            logger.exception(
                "Translation failed for campaign %s",
                campaign_id,
            )

            translated_text = generated_text

            results["stages"]["translate"] = stage_status(
                success=False,
                message=f"Translation failed: {str(exc)}",
            )

    # ---------------------------------------------------------
    # 5. Personalize content
    # ---------------------------------------------------------
    segments = unique_strings(
        getattr(campaign, "target_segments", [])
    )

    target_segment = (
        request.target_segment
        or (segments[0] if segments else "General Audience")
    )

    try:
        try:
            personalization_result = create_ai_variant(
                content=translated_text,
                target_segment=target_segment,
                tone=request.tone or "professional",
            )
        except TypeError:
            personalization_result = create_ai_variant(
                translated_text,
                target_segment,
            )

        personalized_text = extract_content(personalization_result)

        if not personalized_text:
            raise ValueError(
                "The personalization service returned no usable content."
            )

        results["stages"]["personalize"] = stage_status(
            success=True,
            message="Content personalization completed successfully.",
            data={"target_segment": target_segment},
        )

    except Exception as exc:
        logger.exception(
            "Personalization failed for campaign %s",
            campaign_id,
        )

        personalized_text = translated_text

        results["stages"]["personalize"] = stage_status(
            success=False,
            message=f"Personalization failed: {str(exc)}",
        )

    # ---------------------------------------------------------
    # 6. Analyze tone
    # ---------------------------------------------------------
    try:
        try:
            tone_result = analyze_tone(personalized_text)
        except TypeError:
            tone_result = analyze_tone(
                text=personalized_text,
                expected_tone=request.tone or "professional",
            )

        results["stages"]["tone_analysis"] = stage_status(
            success=True,
            message="Tone analysis completed successfully.",
            data=(
                tone_result
                if isinstance(tone_result, dict)
                else {"result": str(tone_result)}
            ),
        )

    except Exception as exc:
        logger.exception(
            "Tone analysis failed for campaign %s",
            campaign_id,
        )

        results["stages"]["tone_analysis"] = stage_status(
            success=False,
            message=f"Tone analysis failed: {str(exc)}",
        )

    # ---------------------------------------------------------
    # 7. Quality and compliance review
    # ---------------------------------------------------------
    try:
        review_request = ReviewRequest(
            content=personalized_text
        )

        try:
            review_result = run_review(
                review_request,
                db=db,
                current_user=current_user,
            )
        except TypeError:
            review_result = run_review(
                review_request,
                db,
            )

        results["stages"]["compliance_review"] = stage_status(
            success=True,
            message="Quality and compliance review completed successfully.",
            data=(
                review_result
                if isinstance(review_result, dict)
                else {"result": str(review_result)}
            ),
        )

    except Exception as exc:
        logger.exception(
            "Compliance review failed for campaign %s",
            campaign_id,
        )

        results["stages"]["compliance_review"] = stage_status(
            success=False,
            message=f"Compliance review failed: {str(exc)}",
        )

    # ---------------------------------------------------------
    # 8. Approval readiness
    # ---------------------------------------------------------
    failed_stages = [
        stage_name
        for stage_name, stage_result in results["stages"].items()
        if stage_result.get("status") == "failed"
    ]

    approval_ready = len(failed_stages) == 0

    results["stages"]["approval_readiness"] = stage_status(
        success=approval_ready,
        message=(
            "Content is ready for the approval workflow."
            if approval_ready
            else "Content requires attention before approval."
        ),
        data={
            "approval_ready": approval_ready,
            "failed_stages": failed_stages,
        },
    )

    results["overall_status"] = (
        "completed"
        if approval_ready
        else "completed_with_errors"
    )

    results["pipeline_completed_at"] = utc_now().isoformat()

    return results
