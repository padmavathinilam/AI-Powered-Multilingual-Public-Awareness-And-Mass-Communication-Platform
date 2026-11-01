from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base


class ContentVariant(Base):
    __tablename__ = "content_variants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    campaign_id = Column(Integer, nullable=True, index=True)
    message_id = Column(Integer, nullable=True, index=True)

    # Base and generated content
    original_content = Column(Text, nullable=True)
    variant_content = Column(Text, nullable=False)

    # Personalization details
    segment = Column(String(100), nullable=True)
    language = Column(String(30), nullable=False, default="English")
    channel = Column(String(30), nullable=False, default="SMS")
    mode = Column(String(30), nullable=False, default="ai")
    base_message = Column(Text, nullable=True)
    text = Column(Text, nullable=True)

    variant_type = Column(String(100), nullable=True)
    status = Column(String(30), nullable=False, default="Generated")

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )