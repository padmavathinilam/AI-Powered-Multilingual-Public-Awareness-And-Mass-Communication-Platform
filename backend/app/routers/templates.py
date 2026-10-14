from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate


router = APIRouter(
    prefix="/api/templates",
    tags=["Templates"]
)


@router.get("/")
def get_templates(
    db: Session = Depends(get_db)
):
    templates = db.query(Template).all()

    return [
        {
            "id": template.id,
            "name": template.name,
            "channel": template.channel,
            "language": template.language,
            "content": template.content,
            "created_by": template.created_by,
            "created_at": template.created_at
        }
        for template in templates
    ]


@router.post("/")
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db)
):
    new_template = Template(
        name=template.name,
        channel=template.channel,
        language=template.language,
        content=template.content,
        created_by=template.created_by
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return {
        "id": new_template.id,
        "name": new_template.name,
        "channel": new_template.channel,
        "language": new_template.language,
        "content": new_template.content,
        "created_by": new_template.created_by,
        "created_at": new_template.created_at
    }