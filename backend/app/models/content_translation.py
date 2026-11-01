
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from app.core.database import Base


class ContentTranslation(Base):
    __tablename__ = "content_translations"

    id = Column(Integer, primary_key=True, index=True)

    # User who created the translation
    user_id = Column(Integer, nullable=False, index=True)

    # Optional campaign and message references
    campaign_id = Column(Integer, nullable=True, index=True)
    message_id = Column(Integer, nullable=True, index=True)

    # Original and translated content
    source_text = Column(Text, nullable=False)
    source_language = Column(String(30), nullable=False, default="English")
    target_language = Column(String(30), nullable=False)
    translated_text = Column(Text, nullable=False)

    # Existing translation workflow status
    status = Column(
        String(30),
        nullable=False,
        default="Auto-translated",
    )

    # Independent review and approval tracking
    is_reviewed = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_approved = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    # Used to identify reusable translation results
    cache_key = Column(String(64), nullable=False, index=True)

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
