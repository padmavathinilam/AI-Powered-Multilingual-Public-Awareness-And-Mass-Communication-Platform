from datetime import datetime

from app.core.database import SessionLocal
from app.models.message import Message

db = SessionLocal()

try:
    messages = db.query(Message).order_by(Message.id).all()

    if not messages:
        print("No messages found in the database.")
    else:
        for message in messages:
            print(
                f"Before: ID={message.id}, "
                f"Member={message.audience_member_id}, "
                f"Clicked={message.clicked_at}"
            )

        message = messages[0]
        message.clicked_at = datetime.now()
        db.commit()
        db.refresh(message)

        print("\nUpdated message:")
        print("Message ID:", message.id)
        print("Audience Member ID:", message.audience_member_id)
        print("Clicked At:", message.clicked_at)

finally:
    db.close()