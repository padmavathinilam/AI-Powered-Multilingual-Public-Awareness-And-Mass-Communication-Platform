import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai_service.personalization_service import (
    create_ai_variant,
    fill_placeholders,
)
from app.core.database import get_db
from app.models.content_variant import ContentVariant
from app.routers.auth import get_current_user
from app.schemas.personalization import (
    PersonalizeRequest,
    PreviewRequest,
    RegenerateVariantRequest,
    UpdateVariantRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ai",
    tags=["Audience Personalization"],
)


def get_user_id(current_user):
    return getattr(current_user, "id", None)


def get_variant_text(variant):
    """Read the saved message while supporting the existing model fields."""
    return (
        variant.variant_content
        or variant.text
        or variant.base_message
        or ""
    )


def set_variant_text(variant, message):
    """Keep the required database field and legacy field synchronized."""
    variant.variant_content = message
    variant.text = message


def get_owned_variant(db: Session, variant_id: int, current_user):
    query = db.query(ContentVariant).filter(
        ContentVariant.id == variant_id
    )

    user_id = get_user_id(current_user)

    if user_id is not None:
        query = query.filter(ContentVariant.user_id == user_id)

    variant = query.first()

    if not variant:
        raise HTTPException(
            status_code=404,
            detail="Content variant not found.",
        )

    return variant


@router.post("/personalize")
async def personalize_content(
    request: PersonalizeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    base_message = request.base_message.strip()

    if not base_message:
        raise HTTPException(
            status_code=400,
            detail="Base message cannot be empty.",
        )

    if not request.segments:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one audience segment.",
        )

    user_id = get_user_id(current_user)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Unable to identify the authenticated user.",
        )

    variants = []

    try:
        for segment in request.segments:
            segment = segment.strip()

            if not segment:
                continue

            if request.mode == "placeholder":
                personalized_text = fill_placeholders(
                    base_message,
                    {"segment": segment, "language": request.language},
                )
            else:
                personalized_text = await create_ai_variant(
                    base_message=base_message,
                    segment=segment,
                    language=request.language,
                    channel=request.channel,
                    tone=request.tone,
                    word_limit=request.word_limit,
                    key_points=request.key_points,
                )

            if not personalized_text or not personalized_text.strip():
                raise HTTPException(
                    status_code=502,
                    detail=(
                        "AI service returned empty content for segment: "
                        f"{segment}"
                    ),
                )

            # variant_content is required by the ContentVariant model.
            variant = ContentVariant(
                campaign_id=request.campaign_id,
                user_id=user_id,
                original_content=base_message,
                variant_content=personalized_text,
                segment=segment,
                language=request.language,
                channel=request.channel,
                mode=request.mode,
                base_message=base_message,
                text=personalized_text,
                status="Generated",
            )

            db.add(variant)
            db.flush()

            variants.append({
                "id": variant.id,
                "campaign_id": variant.campaign_id,
                "segment": variant.segment,
                "language": variant.language,
                "channel": variant.channel,
                "mode": variant.mode,
                "text": get_variant_text(variant),
                "variant_content": variant.variant_content,
                "status": variant.status,
            })

        if not variants:
            raise HTTPException(
                status_code=400,
                detail="Provide at least one valid audience segment.",
            )

        db.commit()

        return {
            "message": "Content variants generated successfully.",
            "count": len(variants),
            "variants": variants,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        logger.exception("Failed to personalize content")
        raise HTTPException(
            status_code=500,
            detail=f"Personalization failed: {type(exc).__name__}: {str(exc)}",
        ) from exc


@router.post("/personalize/preview")
async def preview_personalized_content(
    request: PreviewRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    variant = get_owned_variant(
        db,
        request.variant_id,
        current_user,
    )

    recipient = request.recipient.model_dump()
    recipient["segment"] = variant.segment

    try:
        final_message = fill_placeholders(
            get_variant_text(variant),
            recipient,
        )

        recipient_language = (
            recipient.get("language") or variant.language
        ).strip()

        if recipient_language.lower() != variant.language.strip().lower():
            final_message = await create_ai_variant(
                base_message=final_message,
                segment=variant.segment or "",
                language=recipient_language,
                channel=variant.channel,
                tone="Clear and helpful",
                word_limit=100,
            )

        if variant.channel.strip().lower() == "sms":
            from app.ai_service.service import limit_sms
            final_message = limit_sms(final_message)

        return {
            "variant_id": variant.id,
            "recipient": recipient,
            "segment": variant.segment,
            "language": recipient_language,
            "channel": variant.channel,
            "message": final_message,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Failed to preview personalized content")
        raise HTTPException(
            status_code=500,
            detail=f"Preview failed: {type(exc).__name__}: {str(exc)}",
        ) from exc


@router.put("/personalize/variants/{variant_id}")
def update_personalized_variant(
    variant_id: int,
    request: UpdateVariantRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    variant = get_owned_variant(db, variant_id, current_user)
    new_text = request.text.strip()

    if not new_text:
        raise HTTPException(
            status_code=400,
            detail="Variant text cannot be empty.",
        )

    try:
        set_variant_text(variant, new_text)

        db.commit()
        db.refresh(variant)

        return {
            "message": "Variant updated successfully.",
            "id": variant.id,
            "segment": variant.segment,
            "language": variant.language,
            "channel": variant.channel,
            "text": get_variant_text(variant),
            "variant_content": variant.variant_content,
        }

    except Exception as exc:
        db.rollback()
        logger.exception("Failed to update variant")
        raise HTTPException(
            status_code=500,
            detail=f"Update failed: {type(exc).__name__}: {str(exc)}",
        ) from exc


@router.post("/personalize/variants/{variant_id}/regenerate")
async def regenerate_personalized_variant(
    variant_id: int,
    request: RegenerateVariantRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    variant = get_owned_variant(db, variant_id, current_user)

    try:
        new_text = await create_ai_variant(
            base_message=variant.base_message or "",
            segment=variant.segment or "",
            language=variant.language,
            channel=variant.channel,
            tone=request.tone,
            word_limit=request.word_limit,
            key_points=request.key_points,
        )

        if not new_text or not new_text.strip():
            raise HTTPException(
                status_code=502,
                detail="AI service returned empty content.",
            )

        set_variant_text(variant, new_text)
        variant.mode = "ai"
        variant.status = "Generated"

        db.commit()
        db.refresh(variant)

        return {
            "message": "Variant regenerated successfully.",
            "id": variant.id,
            "segment": variant.segment,
            "language": variant.language,
            "channel": variant.channel,
            "text": get_variant_text(variant),
            "variant_content": variant.variant_content,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        logger.exception("Failed to regenerate variant")
        raise HTTPException(
            status_code=500,
            detail=f"Regeneration failed: {type(exc).__name__}: {str(exc)}",
        ) from exc