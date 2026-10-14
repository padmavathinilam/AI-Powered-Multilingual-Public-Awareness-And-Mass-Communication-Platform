from pydantic import BaseModel


class SegmentCreate(BaseModel):
    name: str
    description: str | None = None