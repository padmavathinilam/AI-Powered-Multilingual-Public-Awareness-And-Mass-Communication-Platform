from pydantic import BaseModel


class FeedbackCreate(BaseModel):
    campaign_id: int
    audience_member_id: int
    rating: int | None = None
    comment: str | None = None