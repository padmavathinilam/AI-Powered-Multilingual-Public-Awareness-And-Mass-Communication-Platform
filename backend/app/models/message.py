from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    campaign_id = Column(
        Integer,
        ForeignKey("campaigns.id"),
        nullable=False
    )

    template_id = Column(
        Integer,
        ForeignKey("templates.id"),
        nullable=True
    )

    audience_member_id = Column(
        Integer,
        ForeignKey("audience_members.id"),
        nullable=False
    )

    language = Column(String(50), nullable=False)

    content = Column(Text, nullable=False)

    channel = Column(String(50), nullable=False)

    status = Column(
        String(50),
        default="pending"
    )

    scheduled_at = Column(DateTime, nullable=True)

    sent_at = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )