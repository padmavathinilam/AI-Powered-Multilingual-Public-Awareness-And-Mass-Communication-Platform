from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


class DeliveryLog(Base):
    __tablename__ = "delivery_logs"

    id = Column(Integer, primary_key=True, index=True)

    message_id = Column(
        Integer,
        ForeignKey("messages.id"),
        nullable=False
    )

    channel = Column(String(50), nullable=False)

    status = Column(String(50), nullable=False)

    provider_message_id = Column(
        String(200),
        nullable=True
    )

    delivered_at = Column(DateTime, nullable=True)

    error_message = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )