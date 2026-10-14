from pydantic import BaseModel


class AudienceCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    age: int | None = None
    gender: str | None = None
    city: str | None = None
    state: str | None = None
    preferred_language: str | None = None