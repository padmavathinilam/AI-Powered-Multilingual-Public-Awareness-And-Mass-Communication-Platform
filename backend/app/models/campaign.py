from datetime import datetime

from sqlalchemy import (
    Column, DateTime, ForeignKey, Integer, String, Text, JSON
)

from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)

    campaign_type = Column(String(50), default="Awareness", nullable=False)
    target_segments = Column(JSON, default=list, nullable=False)
    channels = Column(JSON, default=list, nullable=False)
    priority = Column(String(20), default="Normal", nullable=False)

    status = Column(String(50), default="Draft", nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_at = Column(DateTime, nullable=True)
    end_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)