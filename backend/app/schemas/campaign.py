from datetime import datetime

from pydantic import BaseModel


class CampaignCreate(BaseModel):
    name: str
    description: str | None = None
    objective: str | None = None
    status: str = "draft"
    created_by: int
    start_at: datetime | None = None
    end_at: datetime | None = None