import logging
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.ai_service.service import (
    generate_campaign_content,
    improve_campaign_tone,
)
from app.ai_service.tone_service import analyze_tone
from app.core.database import get_db
from app.models.generated_content import GeneratedContent
from app.models.user import User
from app.models.role import Role
from app.routers.auth import get_current_user
from app.schemas.ai import AIGenerateRequest, AIGenerateResponse
from app.schemas.tone import (
    ToneAnalysisRequest,
    ToneImprovementRequest,
    ToneImprovementResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Content Generation"],
)

# Basic in-memory rate limit: 5 generation requests per user per minute.
# For production, use a shared rate limiter such as Redis.
RATE_LIMIT = 5
RATE_WINDOW_SECONDS = 60

_request_times = defaultdict(deque)
_rate_limit_lock = Lock()


def check_rate_limit(user_id: int) -> None:
    """Limit each user to five generation requests per minute."""
    now = time.monotonic()

    with _rate_limit_lock:
        timestamps = _request_times[user_id]

        while (
            timestamps
            and now - timestamps[0] >= RATE_WINDOW_SECONDS
        ):
            timestamps.popleft()

        if len(timestamps) >= RATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=(
                    "Too many AI generation requests. "
                    "Please wait a minute and try again."
                ),
            )

        timestamps.append(now)


def get_role_name(db: Session, user: User) -> str:
    """Return the current database role of a user."""
    role = (
        db.query(Role)
        .filter(Role.id == user.role_id)
        .first()
    )

    return role.name if role else ""


@router.post(
    "/generate",
    response_model=AIGenerateResponse,
)
async def generate_content(
    payload: AIGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate campaign content and save it for the authenticated user."""

    check_rate_limit(current_user.id)

    try:
        content = await generate_campaign_content(
            topic=payload.topic,
            audience=payload.audience,
            language=payload.language,
            content_type=payload.content_type,
            tone=payload.tone,
            word_limit=payload.word_limit,
            key_points=payload.key_points,
            campaign_type=payload.campaign_type,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        logger.warning(
            "AI generation failed for user_id=%s: %s",
            current_user.id,
            str(exc),
        )

        message = str(exc).lower()

        if "missing from backend/.env" in message:
            raise HTTPException(
                status_code=503,
                detail="AI service is not configured.",
            ) from exc

        if "authentication failed" in message:
            raise HTTPException(
                status_code=502,
                detail="AI provider authentication failed.",
            ) from exc

        if "rate limit" in message or "quota" in message:
            raise HTTPException(
                status_code=429,
                detail="AI provider quota reached. Try again later.",
            ) from exc

        if "timed out" in message:
            raise HTTPException(
                status_code=504,
                detail="AI generation timed out. Please try again.",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail="AI content generation failed. Please try again.",
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Unexpected AI generation error for user_id=%s",
            current_user.id,
        )
        raise HTTPException(
            status_code=502,
            detail="Unexpected AI generation error.",
        ) from exc

    prompt_text = (
        f"Campaign type: {payload.campaign_type}\n"
        f"Topic: {payload.topic}\n"
        f"Audience: {payload.audience}\n"
        f"Language: {payload.language}\n"
        f"Channel: {payload.content_type}\n"
        f"Tone: {payload.tone}\n"
        f"Length: {payload.word_limit} words\n"
        f"Key points: {payload.key_points or 'None'}"
    )

    record = GeneratedContent(
        prompt=prompt_text,
        output=content,
        user_id=current_user.id,
        campaign_type=payload.campaign_type,
        channel=payload.content_type,
        language=payload.language,
    )

    try:
        db.add(record)
        db.commit()
        db.refresh(record)

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception(
            "Could not save generation for user_id=%s",
            current_user.id,
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Content was generated, but saving it failed."
            ),
        ) from exc

    return AIGenerateResponse(
        content=content,
        word_count=len(content.split()),
        language=payload.language,
        content_type=payload.content_type,
    )


@router.get("/history")
def get_generation_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's history; Admins can view all history."""

    try:
        query = db.query(GeneratedContent)

        if get_role_name(db, current_user).lower() != "admin":
            query = query.filter(
                GeneratedContent.user_id == current_user.id
            )

        records = (
            query
            .order_by(GeneratedContent.created_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": record.id,
                "prompt": record.prompt,
                "output": record.output,
                "user_id": record.user_id,
                "campaign_type": record.campaign_type,
                "channel": record.channel,
                "language": record.language,
                "created_at": (
                    record.created_at.isoformat()
                    if record.created_at
                    else None
                ),
            }
            for record in records
        ]

    except SQLAlchemyError as exc:
        logger.exception(
            "Could not retrieve generation history for user_id=%s",
            current_user.id,
        )
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve generation history.",
        ) from exc


@router.post("/analyze-tone")
def analyze_campaign_tone(
    payload: ToneAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze tone, sentiment, readability, and clarity."""

    try:
        return analyze_tone(
            payload.content,
            expected_tone=payload.expected_tone,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Tone analysis failed for user_id=%s",
            current_user.id,
        )
        raise HTTPException(
            status_code=500,
            detail="Tone analysis failed. Please try again.",
        ) from exc


@router.post(
    "/improvetone",
    response_model=ToneImprovementResponse,
)
async def improve_campaign_tone_endpoint(
    payload: ToneImprovementRequest,
    current_user: User = Depends(get_current_user),
):
    """Rewrite content in the selected tone using Gemini."""

    try:
        improved_content = await improve_campaign_tone(
            content=payload.content,
            target_tone=payload.target_tone,
        )

        return ToneImprovementResponse(
            original_content=payload.content,
            improved_content=improved_content,
            target_tone=payload.target_tone,
            word_count=len(improved_content.split()),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        logger.warning(
            "Tone improvement unavailable for user_id=%s: %s",
            current_user.id,
            exc,
        )
        raise HTTPException(
            status_code=503,
            detail="Tone improvement is temporarily unavailable.",
        ) from exc

    except Exception as exc:
        logger.exception(
            "Tone improvement failed for user_id=%s",
            current_user.id,
        )
        raise HTTPException(
            status_code=500,
            detail="Could not improve the content. Please try again.",
        ) from exc