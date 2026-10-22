from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.models.message import Message

db = SessionLocal()

try:
    message = db.query(Message).first()

    if message is None:
        print("No messages found. Create a message first.")
    else:
        message.clicked_at = datetime.now(timezone.utc)
        db.commit()
        print("Message marked as clicked:", message.id)
finally:
    db.close()