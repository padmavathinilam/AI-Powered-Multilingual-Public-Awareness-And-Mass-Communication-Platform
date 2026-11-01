
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models.content_translation import ContentTranslation
from app.routers.auth import get_current_user

from app.schemas.translation import (
    TranslationRequest,
    BulkTranslationRequest,
    LanguageDetectionRequest,
    TranslationUpdateRequest,
)

from app.services.translation_service import (
    LANGUAGE_CODES,
    make_cache_key,
    translate_text,
    detect_language,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["Multilingual Translation"],
)


def translation_to_dict(record, cache_hit=False):
    """Convert a database translation into a JSON-compatible dictionary."""
    return {
        "id": record.id,
        "source_text": record.source_text,
        "source_language": record.source_language,
        "target_language": record.target_language,
        "translated_text": record.translated_text,
        "status": record.status,
        "is_reviewed": bool(getattr(record, "is_reviewed", False)),
        "is_approved": bool(getattr(record, "is_approved", False)),
        "created_at": (
            record.created_at.isoformat()
            if record.created_at
            else None
        ),
        "updated_at": (
            record.updated_at.isoformat()
            if record.updated_at
            else None
        ),
        "cache_hit": cache_hit,
    }


def get_saved_translation(
    db: Session,
    user_id: int,
    cache_key: str,
):
    """Find a previously saved translation for the current user."""
    try:
        return (
            db.query(ContentTranslation)
            .filter(
                ContentTranslation.user_id == user_id,
                ContentTranslation.cache_key == cache_key,
            )
            .order_by(ContentTranslation.id.desc())
            .first()
        )
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database lookup failed for translation history.")
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not access translation history. "
                "Check the backend log for the database error."
            ),
        ) from exc


def save_translation(
    db: Session,
    user_id: int,
    text: str,
    source_language: str,
    target_language: str,
    campaign_id: int | None = None,
    message_id: int | None = None,
):
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Translation text cannot be empty.",
        )

    text = text.strip()

    if source_language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported source language: {source_language}",
        )

    if target_language not in LANGUAGE_CODES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported target language: {target_language}",
        )

    cache_key = make_cache_key(
        text,
        source_language,
        target_language,
    )

    # Reuse the current user's saved translation.
    existing = get_saved_translation(
        db=db,
        user_id=user_id,
        cache_key=cache_key,
    )

    if existing is not None:
        return translation_to_dict(existing, cache_hit=True)

    # Generate translation.
    try:
        if source_language == target_language:
            translated = text
        else:
            translated = translate_text(
                text,
                source_language,
                target_language,
            )

        if not isinstance(translated, str) or not translated.strip():
            raise ValueError("The translation provider returned empty text.")

        translated = translated.strip()

    except ValueError as exc:
        logger.warning(
            "Translation validation failed (%s -> %s): %s",
            source_language,
            target_language,
            exc,
        )
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Translation provider failed (%s -> %s).",
            source_language,
            target_language,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Translation provider failed. "
                "Check the backend logs and provider configuration."
            ),
        ) from exc

    # Save translation to the database.
    try:
        record = ContentTranslation(
            user_id=user_id,
            campaign_id=campaign_id,
            message_id=message_id,
            source_text=text,
            source_language=source_language,
            target_language=target_language,
            translated_text=translated,
            status="Auto-translated",
            is_reviewed=False,
            is_approved=False,
            cache_key=cache_key,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return translation_to_dict(record, cache_hit=False)

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to save translation.")
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not save the translation. "
                "Check the backend log for the database error."
            ),
        ) from exc


@router.post("/translate")
def translate_single(
    request: TranslationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return save_translation(
        db=db,
        user_id=current_user.id,
        text=request.text,
        source_language=request.source_language,
        target_language=request.target_language,
        campaign_id=request.campaign_id,
        message_id=request.message_id,
    )


@router.post("/translate/bulk")
def translate_bulk(
    request: BulkTranslationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    languages = list(dict.fromkeys(request.target_languages))
    results = []

    for language in languages:
        result = save_translation(
            db=db,
            user_id=current_user.id,
            text=request.text,
            source_language=request.source_language,
            target_language=language,
            campaign_id=request.campaign_id,
            message_id=request.message_id,
        )
        results.append(result)

    return {
        "source_text": request.text,
        "total": len(results),
        "translations": results,
    }


@router.get("/translate/history")
def get_translation_history(
    source_text: str | None = Query(default=None),
    target_language: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        query = db.query(ContentTranslation).filter(
            ContentTranslation.user_id == current_user.id
        )

        if source_text is not None:
            query = query.filter(
                ContentTranslation.source_text == source_text
            )

        if target_language is not None:
            if target_language not in LANGUAGE_CODES:
                raise HTTPException(
                    status_code=422,
                    detail=f"Unsupported target language: {target_language}",
                )

            query = query.filter(
                ContentTranslation.target_language == target_language
            )

        records = (
            query.order_by(ContentTranslation.id.desc())
            .limit(limit)
            .all()
        )

        return {
            "total": len(records),
            "translations": [
                translation_to_dict(record)
                for record in records
            ],
        }

    except HTTPException:
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to retrieve translation history.")
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not retrieve translation history. "
                "Check the backend log for the database error."
            ),
        ) from exc


@router.post("/translate/detect")
def detect_source_language(
    request: LanguageDetectionRequest,
    current_user=Depends(get_current_user),
):
    try:
        return detect_language(request.text)

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Language detection failed.")
        raise HTTPException(
            status_code=500,
            detail="Could not detect the source language.",
        ) from exc


@router.get("/translate/health")
def translation_health():
    return {
        "status": "ok",
        "message": "Translation router is running.",
    }


@router.patch("/translate/{translation_id}")
def update_translation(
    translation_id: int,
    request: TranslationUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        record = (
            db.query(ContentTranslation)
            .filter(
                ContentTranslation.id == translation_id,
                ContentTranslation.user_id == current_user.id,
            )
            .first()
        )

        if record is None:
            raise HTTPException(
                status_code=404,
                detail="Translation not found.",
            )

        changes = request.model_dump(exclude_unset=True)

        if not changes:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Provide translated_text, status, "
                    "is_reviewed, or is_approved to update."
                ),
            )

        allowed_statuses = {
            "Auto-translated",
            "Reviewed",
            "Approved",
        }

        if "status" in changes:
            if changes["status"] not in allowed_statuses:
                raise HTTPException(
                    status_code=422,
                    detail="Invalid translation status.",
                )

            record.status = changes["status"]

            if changes["status"] == "Reviewed":
                record.is_reviewed = True
            elif changes["status"] == "Approved":
                record.is_approved = True

        if "translated_text" in changes:
            value = changes["translated_text"]

            if not isinstance(value, str) or not value.strip():
                raise HTTPException(
                    status_code=422,
                    detail="Translated text cannot be empty.",
                )

            record.translated_text = value.strip()

        if "is_reviewed" in changes:
            value = changes["is_reviewed"]
            if not isinstance(value, bool):
                raise HTTPException(
                    status_code=422,
                    detail="is_reviewed must be true or false.",
                )
            record.is_reviewed = value
            if value:
                record.status = (
                    "Approved"
                    if record.is_approved
                    else "Reviewed"
                )

        if "is_approved" in changes:
            value = changes["is_approved"]
            if not isinstance(value, bool):
                raise HTTPException(
                    status_code=422,
                    detail="is_approved must be true or false.",
                )
            record.is_approved = value
            if value:
                record.status = "Approved"
            elif record.is_reviewed:
                record.status = "Reviewed"
            else:
                record.status = "Auto-translated"

        db.commit()
        db.refresh(record)

        return translation_to_dict(record)

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception(
            "Failed to update translation ID %s.",
            translation_id,
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not update the translation. "
                "Check the backend log for the database error."
            ),
        ) from exc
