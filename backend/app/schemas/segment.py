
from pydantic import BaseModel, Field
from typing import Any, Literal


class SegmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    filter_rules: dict[str, Any] = Field(
        default_factory=lambda: {"logic": "AND", "rules": []}
    )


class SegmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    filter_rules: dict[str, Any] | None = None


class SegmentPreview(BaseModel):
    filter_rules: dict[str, Any] = Field(
        default_factory=lambda: {"logic": "AND", "rules": []}
    )
    sample_size: int = Field(default=10, ge=1, le=100)


class SegmentRule(BaseModel):
    field: str
    operator: Literal[
        "equals",
        "not_equals",
        "greater_than",
        "greater_than_or_equal",
        "less_than",
        "less_than_or_equal",
        "contains",
        "in",
    ]
    value: Any


class SegmentRules(BaseModel):
    logic: Literal["AND", "OR"] = "AND"
    rules: list[SegmentRule] = Field(default_factory=list)
