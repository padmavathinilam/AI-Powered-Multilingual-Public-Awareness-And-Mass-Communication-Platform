from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


CAMPAIGN_TYPES = {
    "Awareness",
    "Emergency Alert",
    "Educational",
    "Organizational Announcement",
}

CAMPAIGN_STATUSES = {
    "Draft",
    "In Review",
    "Approved",
    "Scheduled",
    "Running",
    "Completed",
    "Failed",
}


class CampaignCreate(BaseModel):
    name: str
    description: str | None = None
    objective: str | None = None
    campaign_type: str = "Awareness"
    target_segments: list[int] = Field(default_factory=list)
    channels: list[str] = Field(default_factory=list)
    priority: str = "Normal"
    status: str = "Draft"
    created_by: int
    start_at: datetime | None = None
    end_at: datetime | None = None

    @model_validator(mode="after")
    def validate_campaign(self):
        if self.campaign_type not in CAMPAIGN_TYPES:
            raise ValueError("Invalid campaign_type")
        if self.status not in CAMPAIGN_STATUSES:
            raise ValueError("Invalid campaign status")
        if self.start_at and self.end_at and self.end_at < self.start_at:
            raise ValueError("end_at cannot be earlier than start_at")
        if self.campaign_type == "Emergency Alert":
            self.priority = "High"
        return self


class CampaignUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    objective: str | None = None
    campaign_type: str | None = None
    target_segments: list[int] | None = None
    channels: list[str] | None = None
    priority: str | None = None
    status: str | None = None
    created_by: int | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None


class CampaignStatusUpdate(BaseModel):
    status: str