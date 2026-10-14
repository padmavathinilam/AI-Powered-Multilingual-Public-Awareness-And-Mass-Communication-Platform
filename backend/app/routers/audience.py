from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audience_member import AudienceMember
from app.schemas.audience import AudienceCreate


router = APIRouter(
    prefix="/api/audience",
    tags=["Audience"]
)


@router.get("/")
def get_audience_members(
    db: Session = Depends(get_db)
):
    members = db.query(AudienceMember).all()

    return [
        {
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "phone": member.phone,
            "age": member.age,
            "gender": member.gender,
            "city": member.city,
            "state": member.state,
            "preferred_language": member.preferred_language,
            "created_at": member.created_at
        }
        for member in members
    ]


@router.post("/")
def create_audience_member(
    member: AudienceCreate,
    db: Session = Depends(get_db)
):
    new_member = AudienceMember(
        name=member.name,
        email=member.email,
        phone=member.phone,
        age=member.age,
        gender=member.gender,
        city=member.city,
        state=member.state,
        preferred_language=member.preferred_language
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return {
        "id": new_member.id,
        "name": new_member.name,
        "email": new_member.email,
        "phone": new_member.phone,
        "age": new_member.age,
        "gender": new_member.gender,
        "city": new_member.city,
        "state": new_member.state,
        "preferred_language": new_member.preferred_language,
        "created_at": new_member.created_at
    }