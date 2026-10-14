from datetime import datetime

from pydantic import BaseModel


class DeliveryLogCreate(BaseModel):
    message_id: int
    channel: str
    status: str
    provider_message_id: str | None = None
    delivered_at: datetime | None = None
    error_message: str | None = None