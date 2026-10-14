from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text

from app.core.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)

    campaign_id = Column(
        Integer,
        ForeignKey("campaigns.id"),
        nullable=False
    )

    audience_member_id = Column(
        Integer,
        ForeignKey("audience_members.id"),
        nullable=False
    )

    rating = Column(Integer, nullable=True)

    comment = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )