from pydantic import BaseModel


class TemplateCreate(BaseModel):
    name: str
    channel: str
    language: str
    content: str
    created_by: int