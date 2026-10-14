from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    campaign_id: int
    template_id: int | None = None
    audience_member_id: int
    language: str
    content: str
    channel: str
    status: str = "pending"
    scheduled_at: datetime | None = None