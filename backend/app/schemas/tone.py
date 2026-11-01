from typing import Literal

from pydantic import BaseModel, Field, field_validator


ToneName = Literal[
    "Friendly",
    "Formal",
    "Persuasive",
    "Informative",
    "Urgent",
]


class ToneAnalysisRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    expected_tone: ToneName = "Informative"

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Content cannot be empty.")
        return value


class ToneImprovementRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    target_tone: ToneName = "Friendly"

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Content cannot be empty.")
        return value


class ToneImprovementResponse(BaseModel):
    original_content: str
    improved_content: str
    target_tone: str
    word_count: int