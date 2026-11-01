from typing import Literal, Optional

from pydantic import BaseModel, Field


class AudienceProfile(BaseModel):
    name: str = "there"
    age: Optional[int] = None
    occupation: str = ""
    city: str = ""
    language: str = "English"
    role: str = ""


class PersonalizeRequest(BaseModel):
    base_message: str = Field(..., min_length=1, max_length=10000)
    segments: list[str] = Field(..., min_length=1, max_length=20)
    language: str = "English"
    channel: str = "SMS"
    mode: Literal["placeholder", "ai"] = "ai"
    campaign_id: Optional[int] = None
    tone: str = "Clear and helpful"
    word_limit: int = Field(default=100, ge=20, le=500)
    key_points: str = ""


class PreviewRequest(BaseModel):
    variant_id: int
    recipient: AudienceProfile


class UpdateVariantRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class RegenerateVariantRequest(BaseModel):
    tone: str = "Clear and helpful"
    word_limit: int = Field(default=100, ge=20, le=500)
    key_points: str = ""