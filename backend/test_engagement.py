from datetime import datetime

from app.core.database import SessionLocal
from app.models.message import Message

db = SessionLocal()

try:
    message = db.query(Message).first()

    if message is None:
        print("No messages found. Create a message first.")
    else:
        message.opened_at = datetime.utcnow()
        db.commit()

        print("Test message marked as opened.")
        print("Message ID:", message.id)
        print("Audience Member ID:", message.audience_member_id)

finally:
    db.close()