import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate

router = APIRouter(prefix="/api/templates", tags=["Templates"])


def template_to_dict(t):
    return {
        "id": t.id,
        "name": t.name,
        "title": t.title or t.name,
        "category": t.category or "General",
        "channel": t.channel,
        "language": t.language,
        "content": t.content,
        "body": t.body or t.content,
        "tags": t.tags or [],
        "created_by": t.created_by,
        "created_at": t.created_at,
    }


@router.get("/")
def get_templates(
    search: str | None = None,
    category: str | None = None,
    language: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Template)

    if search:
        query = query.filter(
            (Template.name.ilike(f"%{search}%"))
            | (Template.content.ilike(f"%{search}%"))
            | (Template.category.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Template.category == category)
    if language:
        query = query.filter(Template.language == language)
    if channel:
        query = query.filter(Template.channel == channel)

    return [template_to_dict(t) for t in query.order_by(Template.id.desc()).all()]


@router.post("/")
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    body = payload.body if payload.body is not None else payload.content
    template = Template(
        name=payload.name,
        title=payload.title or payload.name,
        category=payload.category,
        channel=payload.channel,
        language=payload.language,
        content=payload.content or body,
        body=body,
        tags=payload.tags,
        created_by=payload.created_by,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template_to_dict(template)


@router.get("/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template_to_dict(template)


@router.put("/{template_id}")
def update_template(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(template, key, value)

    if "title" in data and "name" not in data:
        template.name = data["title"]
    if "name" in data and "title" not in data:
        template.title = data["name"]
    if "body" in data and "content" not in data:
        template.content = data["body"]
    if "content" in data and "body" not in data:
        template.body = data["content"]

    db.commit()
    db.refresh(template)
    return template_to_dict(template)


@router.post("/{template_id}/preview")
def preview_template(
    template_id: int,
    sample_data: dict,
    db: Session = Depends(get_db),
):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    text = template.body or template.content
    rendered = re.sub(
        r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}",
        lambda match: str(sample_data.get(match.group(1), match.group(0))),
        text,
    )
    return {"template_id": template.id, "preview": rendered}


@router.post("/preview-content")
def preview_template_content(payload: dict):
    text = payload.get("body", payload.get("content", ""))
    sample_data = payload.get("sample_data", {})
    rendered = re.sub(
        r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}",
        lambda match: str(sample_data.get(match.group(1), match.group(0))),
        text,
    )
    return {"preview": rendered}


@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully", "id": template_id}