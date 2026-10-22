from pydantic import BaseModel, Field


class TemplateCreate(BaseModel):
    name: str
    channel: str
    language: str
    content: str
    created_by: int
    title: str | None = None
    category: str = "General"
    body: str | None = None
    tags: list[str] = Field(default_factory=list)


class TemplateUpdate(BaseModel):
    name: str | None = None
    channel: str | None = None
    language: str | None = None
    content: str | None = None
    title: str | None = None
    category: str | None = None
    body: str | None = None
    tags: list[str] | None = None