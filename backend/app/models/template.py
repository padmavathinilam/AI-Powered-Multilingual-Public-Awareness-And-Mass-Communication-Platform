from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON

from app.core.database import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    title = Column(String(200), nullable=True)
    category = Column(String(100), default="General", nullable=False)
    channel = Column(String(50), nullable=False)
    language = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    body = Column(Text, nullable=True)
    tags = Column(JSON, default=list, nullable=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)