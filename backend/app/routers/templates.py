
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.models.user import User
from app.routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/templates",
    tags=["Templates"],
)


def template_to_dict(template: Template) -> dict:
    """Convert a template database record into a JSON-friendly dictionary."""
    return {
        "id": template.id,
        "name": template.name,
        "title": template.title or template.name,
        "category": template.category or "General",
        "channel": template.channel,
        "language": template.language,
        "content": template.content,
        "body": template.body or template.content,
        "tags": template.tags or [],
        "created_by": template.created_by,
        "created_at": (
            template.created_at.isoformat()
            if template.created_at
            else None
        ),
    }


def render_template(text: str, sample_data: dict) -> str:
    """Replace placeholders such as {name} and {city}."""
    if not text:
        return ""

    return re.sub(
        r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}",
        lambda match: str(
            sample_data.get(match.group(1), match.group(0))
        ),
        text,
    )


@router.get("/")
def get_templates(
    search: str | None = None,
    category: str | None = None,
    language: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db),
):
    """Retrieve templates with optional filters."""
    try:
        query = db.query(Template)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                (Template.name.ilike(search_term))
                | (Template.content.ilike(search_term))
                | (Template.category.ilike(search_term))
            )

        if category:
            query = query.filter(Template.category == category)

        if language:
            query = query.filter(Template.language == language)

        if channel:
            query = query.filter(Template.channel == channel)

        templates = (
            query.order_by(Template.id.desc())
            .all()
        )

        return [template_to_dict(item) for item in templates]

    except SQLAlchemyError as exc:
        logger.exception("Failed to retrieve templates")
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve templates.",
        ) from exc


@router.post("/")
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a template owned by the authenticated user."""

    name = (payload.name or payload.title or "").strip()
    content = (payload.content or payload.body or "").strip()
    language = (payload.language or "English").strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Template name is required.",
        )

    if not content:
        raise HTTPException(
            status_code=422,
            detail="Template content is required.",
        )

    if not language:
        language = "English"

    try:
        template = Template(
            name=name,
            title=payload.title or name,
            category=payload.category or "General",
            channel=payload.channel,
            language=language,
            content=content,
            body=payload.body or content,
            tags=payload.tags or [],
            created_by=current_user.id,
        )

        db.add(template)
        db.commit()
        db.refresh(template)

        return template_to_dict(template)

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to create template")
        raise HTTPException(
            status_code=500,
            detail="Could not save the template.",
        ) from exc


@router.get("/{template_id}")
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve one template by ID."""
    template = (
        db.query(Template)
        .filter(Template.id == template_id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found.",
        )

    return template_to_dict(template)


@router.put("/{template_id}")
def update_template(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a template while preserving its owner."""

    template = (
        db.query(Template)
        .filter(Template.id == template_id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found.",
        )

    # Only update fields supplied by the caller.
    data = payload.model_dump(exclude_unset=True)

    # Never allow an update request to change the template owner.
    data.pop("created_by", None)

    # Keep name/title and body/content synchronized.
    if "title" in data and "name" not in data:
        data["name"] = data["title"]

    if "name" in data and "title" not in data:
        data["title"] = data["name"]

    if "body" in data and "content" not in data:
        data["content"] = data["body"]

    if "content" in data and "body" not in data:
        data["body"] = data["content"]

    try:
        for key, value in data.items():
            if hasattr(template, key):
                setattr(template, key, value)

        db.commit()
        db.refresh(template)

        return template_to_dict(template)

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception(
            "Failed to update template_id=%s",
            template_id,
        )
        raise HTTPException(
            status_code=500,
            detail="Could not update the template.",
        ) from exc


@router.post("/{template_id}/preview")
def preview_template(
    template_id: int,
    sample_data: dict,
    db: Session = Depends(get_db),
):
    """Preview a saved template using sample recipient data."""

    template = (
        db.query(Template)
        .filter(Template.id == template_id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found.",
        )

    text = template.body or template.content
    rendered = render_template(text, sample_data)

    return {
        "template_id": template.id,
        "preview": rendered,
    }


@router.post("/preview-content")
def preview_template_content(payload: dict):
    """Preview unsaved content using sample recipient data."""

    text = payload.get(
        "body",
        payload.get("content", ""),
    )

    sample_data = payload.get("sample_data", {})

    if not isinstance(text, str):
        raise HTTPException(
            status_code=422,
            detail="Content must be a string.",
        )

    if not isinstance(sample_data, dict):
        raise HTTPException(
            status_code=422,
            detail="sample_data must be an object.",
        )

    rendered = render_template(text, sample_data)

    return {"preview": rendered}


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a template."""

    template = (
        db.query(Template)
        .filter(Template.id == template_id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found.",
        )

    try:
        db.delete(template)
        db.commit()

        return {
            "message": "Template deleted successfully.",
            "id": template_id,
        }

    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception(
            "Failed to delete template_id=%s",
            template_id,
        )
        raise HTTPException(
            status_code=500,
            detail="Could not delete the template.",
        ) from exc
