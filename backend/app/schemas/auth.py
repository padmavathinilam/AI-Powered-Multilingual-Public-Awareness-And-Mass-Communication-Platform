
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    organization_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=8, max_length=72)
    role: str = Field(..., min_length=1, max_length=100)

    @field_validator("name", "organization_name", "role")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        value = value.strip()
        digits = "".join(ch for ch in value if ch.isdigit())
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Enter a valid phone number")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(ch.isupper() for ch in value):
            raise ValueError("Password must contain an uppercase letter")
        if not any(ch.islower() for ch in value):
            raise ValueError("Password must contain a lowercase letter")
        if not any(ch.isdigit() for ch in value):
            raise ValueError("Password must contain a number")
        if not any(not ch.isalnum() for ch in value):
            raise ValueError("Password must contain a special character")
        return value


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    name: str
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)