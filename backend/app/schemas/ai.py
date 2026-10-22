
from typing import Literal

from pydantic import BaseModel, Field, field_validator


IndianLanguage = Literal[
    "English",
    "Assamese",
    "Bengali",
    "Bodo",
    "Dogri",
    "Gujarati",
    "Hindi",
    "Kannada",
    "Kashmiri",
    "Konkani",
    "Maithili",
    "Malayalam",
    "Manipuri",
    "Marathi",
    "Nepali",
    "Odia",
    "Punjabi",
    "Sanskrit",
    "Santali",
    "Sindhi",
    "Tamil",
    "Telugu",
    "Urdu",
]


class AIGenerateRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    audience: str = Field(min_length=2, max_length=200)

    language: IndianLanguage = "English"

    content_type: Literal[
        "Awareness Message",
        "Social Media Post",
        "SMS",
        "Announcement",
    ] = "Awareness Message"

    tone: Literal[
        "Friendly",
        "Formal",
        "Persuasive",
        "Informative",
    ] = "Friendly"

    word_limit: int = Field(default=150, ge=20, le=500)

    @field_validator("topic", "audience")
    @classmethod
    def validate_non_empty_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty.")

        return value


class AIGenerateResponse(BaseModel):
    content: str
    word_count: int
    language: str
    content_type: str
