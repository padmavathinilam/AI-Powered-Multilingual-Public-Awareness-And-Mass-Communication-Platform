from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.delivery_log import DeliveryLog
from app.schemas.delivery_log import DeliveryLogCreate


router = APIRouter(
    prefix="/api/delivery-logs",
    tags=["Delivery Logs"]
)


@router.get("/")
def get_delivery_logs(
    db: Session = Depends(get_db)
):
    logs = db.query(DeliveryLog).all()

    return [
        {
            "id": log.id,
            "message_id": log.message_id,
            "channel": log.channel,
            "status": log.status,
            "provider_message_id": log.provider_message_id,
            "delivered_at": log.delivered_at,
            "error_message": log.error_message,
            "created_at": log.created_at
        }
        for log in logs
    ]


@router.post("/")
def create_delivery_log(
    log: DeliveryLogCreate,
    db: Session = Depends(get_db)
):
    new_log = DeliveryLog(
        message_id=log.message_id,
        channel=log.channel,
        status=log.status,
        provider_message_id=log.provider_message_id,
        delivered_at=log.delivered_at,
        error_message=log.error_message
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "id": new_log.id,
        "message_id": new_log.message_id,
        "channel": new_log.channel,
        "status": new_log.status,
        "provider_message_id": new_log.provider_message_id,
        "delivered_at": new_log.delivered_at,
        "error_message": new_log.error_message,
        "created_at": new_log.created_at
    }