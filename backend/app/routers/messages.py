from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.message import Message
from app.schemas.message import MessageCreate


router = APIRouter(
    prefix="/api/messages",
    tags=["Messages"]
)


@router.get("/")
def get_messages(
    db: Session = Depends(get_db)
):
    messages = db.query(Message).all()

    return [
        {
            "id": message.id,
            "campaign_id": message.campaign_id,
            "template_id": message.template_id,
            "audience_member_id": message.audience_member_id,
            "language": message.language,
            "content": message.content,
            "channel": message.channel,
            "status": message.status,
            "scheduled_at": message.scheduled_at,
            "sent_at": message.sent_at,
            "created_at": message.created_at
        }
        for message in messages
    ]


@router.post("/")
def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db)
):
    new_message = Message(
        campaign_id=message.campaign_id,
        template_id=message.template_id,
        audience_member_id=message.audience_member_id,
        language=message.language,
        content=message.content,
        channel=message.channel,
        status=message.status,
        scheduled_at=message.scheduled_at
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "id": new_message.id,
        "campaign_id": new_message.campaign_id,
        "template_id": new_message.template_id,
        "audience_member_id": new_message.audience_member_id,
        "language": new_message.language,
        "content": new_message.content,
        "channel": new_message.channel,
        "status": new_message.status,
        "scheduled_at": new_message.scheduled_at,
        "sent_at": new_message.sent_at,
        "created_at": new_message.created_at
    }