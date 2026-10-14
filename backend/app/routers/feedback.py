from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate


router = APIRouter(
    prefix="/api/feedback",
    tags=["Feedback"]
)


@router.get("/")
def get_feedback(
    db: Session = Depends(get_db)
):
    feedback = db.query(Feedback).all()

    return [
        {
            "id": item.id,
            "campaign_id": item.campaign_id,
            "audience_member_id": item.audience_member_id,
            "rating": item.rating,
            "comment": item.comment,
            "created_at": item.created_at
        }
        for item in feedback
    ]


@router.post("/")
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db)
):
    new_feedback = Feedback(
        campaign_id=feedback.campaign_id,
        audience_member_id=feedback.audience_member_id,
        rating=feedback.rating,
        comment=feedback.comment
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return {
        "id": new_feedback.id,
        "campaign_id": new_feedback.campaign_id,
        "audience_member_id": new_feedback.audience_member_id,
        "rating": new_feedback.rating,
        "comment": new_feedback.comment,
        "created_at": new_feedback.created_at
    }