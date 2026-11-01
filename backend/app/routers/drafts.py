from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.generated_content import GeneratedContent
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/drafts",
    tags=["Campaign Drafts"],
)


class DraftCreate(BaseModel):
    content: str = Field(..., min_length=1)
    topic: str = ""
    campaign_type: str = "Awareness"
    channel: str = "SMS"
    language: str = "English"


@router.post("/")
def save_draft(
    payload: DraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = payload.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Draft content cannot be empty.",
        )

    try:
        draft = GeneratedContent(
            prompt=f"Draft: {payload.topic}",
            output=content,
            user_id=current_user.id,
            campaign_type=payload.campaign_type,
            channel=payload.channel,
            language=payload.language,
        )

        db.add(draft)
        db.commit()
        db.refresh(draft)

        return {
            "message": "Draft saved successfully.",
            "id": draft.id,
            "content": draft.output,
            "topic": payload.topic,
            "campaign_type": draft.campaign_type,
            "channel": draft.channel,
            "language": draft.language,
            "created_at": (
                draft.created_at.isoformat()
                if draft.created_at
                else datetime.utcnow().isoformat()
            ),
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the draft.",
        ) from exc