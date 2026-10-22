from datetime import datetime
from app.core.database import SessionLocal
from app.models.message import Message
from app.models.audience_member import AudienceMember

db = SessionLocal()

try:
    message = db.query(Message).filter(Message.id == 1).first()
    member = db.query(AudienceMember).order_by(AudienceMember.id).first()

    if message is None:
        print("Message ID 1 was not found.")
    elif member is None:
        print("No audience members exist.")
    else:
        message.audience_member_id = member.id
        message.clicked_at = datetime.now()
        db.commit()

        print("Test message updated successfully.")
        print("Message ID:", message.id)
        print("Audience Member ID:", message.audience_member_id)
        print("Clicked At:", message.clicked_at)
finally:
    db.close()