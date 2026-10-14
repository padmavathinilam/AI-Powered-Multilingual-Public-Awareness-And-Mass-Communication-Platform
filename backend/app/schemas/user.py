from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    password_hash: str
    role_id: int