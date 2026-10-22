
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator


LANGUAGES = [
    "English", "Telugu", "Hindi", "Tamil", "Kannada",
    "Malayalam", "Marathi", "Bengali", "Gujarati",
    "Punjabi", "Urdu", "Odia", "Assamese",
]

CHANNELS = [
    "Email", "SMS", "WhatsApp", "Mobile Notification", "Website"
]

CONSENT_STATUSES = ["Pending", "Granted", "Revoked"]


class AudienceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    preferred_language: str | None = Field(
        default=None, max_length=50
    )
    occupation: str | None = Field(default=None, max_length=100)
    organization_department: str | None = Field(
        default=None, max_length=150
    )
    preferred_channel: str | None = Field(
        default=None, max_length=50
    )
    consent_status: str = "Pending"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        if value is None or not value.strip():
            return None
        return value.strip().lower()

    @field_validator(
        "phone", "city", "state", "gender", "occupation",
        "organization_department", "preferred_language",
        "preferred_channel", "consent_status",
    )
    @classmethod
    def trim_optional_text(cls, value):
        if value is None:
            return None
        return value.strip() or None


class AudienceUpdate(AudienceCreate):
    pass


class AudienceResponse(AudienceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: object
