
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime

from app.core.database import Base


class GeneratedContent(Base):
    __tablename__ = "generated_contents"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    output = Column(Text, nullable=False)

    user_id = Column(Integer, nullable=True, index=True)
    campaign_type = Column(String(50), nullable=False)
    channel = Column(String(50), nullable=False, default="SMS")
    language = Column(String(50), nullable=False, default="English")

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
