from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.segment import Segment
from app.schemas.segment import SegmentCreate


router = APIRouter(
    prefix="/api/segments",
    tags=["Segments"]
)


@router.get("/")
def get_segments(
    db: Session = Depends(get_db)
):
    segments = db.query(Segment).all()

    return [
        {
            "id": segment.id,
            "name": segment.name,
            "description": segment.description
        }
        for segment in segments
    ]


@router.post("/")
def create_segment(
    segment: SegmentCreate,
    db: Session = Depends(get_db)
):
    new_segment = Segment(
        name=segment.name,
        description=segment.description
    )

    db.add(new_segment)
    db.commit()
    db.refresh(new_segment)

    return {
        "id": new_segment.id,
        "name": new_segment.name,
        "description": new_segment.description
    }