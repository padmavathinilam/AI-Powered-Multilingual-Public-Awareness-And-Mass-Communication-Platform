
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.core.database import Base


class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)

    filter_rules = Column(
        JSON,
        nullable=False,
        default=lambda: {"logic": "AND", "rules": []}
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
