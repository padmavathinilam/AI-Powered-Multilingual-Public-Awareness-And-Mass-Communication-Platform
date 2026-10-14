from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.core.database import Base


class AudienceMember(Base):
    __tablename__ = "audience_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    preferred_language = Column(String(50), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )