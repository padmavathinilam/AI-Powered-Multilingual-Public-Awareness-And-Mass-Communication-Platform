from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


Language = Literal[
    "Hindi",
    "Kannada",
    "Tamil",
    "Telugu",
    "Marathi",
    "Bengali",
    "Gujarati",
    "Malayalam",
    "Punjabi",
    "Urdu",
]

TranslationStatus = Literal[
    "Auto-translated",
    "Reviewed",
    "Approved",
]


class TranslationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    target_language: Language
    source_language: str = "English"
    campaign_id: int | None = None
    message_id: int | None = None


class BulkTranslationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    target_languages: list[Language] = Field(min_length=1, max_length=10)
    source_language: str = "English"
    campaign_id: int | None = None
    message_id: int | None = None


class LanguageDetectionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)


class TranslationUpdateRequest(BaseModel):
    translated_text: str | None = Field(
        default=None,
        min_length=1,
        max_length=10000,
    )
    status: TranslationStatus | None = None
    is_reviewed: bool | None = None
    is_approved: bool | None = None


class TranslationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_text: str
    source_language: str
    target_language: str
    translated_text: str
    status: str
    is_reviewed: bool = False
    is_approved: bool = False
    cache_hit: bool = False