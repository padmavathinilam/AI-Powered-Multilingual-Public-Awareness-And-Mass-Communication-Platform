
import logging

from fastapi import APIRouter, HTTPException

from app.ai_service.service import generate_campaign_content
from app.schemas.ai import AIGenerateRequest, AIGenerateResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Content Generation"],
)


@router.post("/generate", response_model=AIGenerateResponse)
async def generate_content(payload: AIGenerateRequest):
    try:
        content = await generate_campaign_content(
            topic=payload.topic,
            audience=payload.audience,
            language=payload.language,
            content_type=payload.content_type,
            tone=payload.tone,
            word_limit=payload.word_limit,
        )

        return AIGenerateResponse(
            content=content,
            word_count=len(content.split()),
            language=payload.language,
            content_type=payload.content_type,
        )

    except RuntimeError as exc:
        logger.exception("AI content generation runtime error")
        message = str(exc).lower()

        if "missing from backend/.env" in message:
            raise HTTPException(
                status_code=503,
                detail="AI service is not configured. Check backend/.env.",
            ) from exc

        if "authentication failed" in message:
            raise HTTPException(
                status_code=502,
                detail="Gemini authentication failed. Check backend settings.",
            ) from exc

        if "rate limit" in message:
            raise HTTPException(
                status_code=429,
                detail="Gemini rate limit reached. Try again later.",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail="AI content generation failed. Check the backend terminal.",
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected AI content generation error")
        raise HTTPException(
            status_code=502,
            detail="Unexpected AI error. Check the backend terminal.",
        ) from exc
