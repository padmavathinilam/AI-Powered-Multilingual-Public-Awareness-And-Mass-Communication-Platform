from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignStatusUpdate,
    CAMPAIGN_TYPES,
    CAMPAIGN_STATUSES,
)

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


def campaign_to_dict(c):
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "objective": c.objective,
        "campaign_type": c.campaign_type,
        "target_segments": c.target_segments or [],
        "channels": c.channels or [],
        "priority": c.priority,
        "status": c.status,
        "created_by": c.created_by,
        "start_at": c.start_at,
        "end_at": c.end_at,
        "created_at": c.created_at,
    }


@router.get("/")
def get_campaigns(
    search: str | None = None,
    status: str | None = None,
    campaign_type: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Campaign)

    if search:
        query = query.filter(Campaign.name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Campaign.status == status)
    if campaign_type:
        query = query.filter(Campaign.campaign_type == campaign_type)

    return [campaign_to_dict(c) for c in query.order_by(Campaign.id.desc()).all()]


@router.post("/")
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()

    if data["campaign_type"] == "Emergency Alert":
        data["priority"] = "High"

    campaign = Campaign(**data)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign_to_dict(campaign)


@router.get("/{campaign_id}")
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign_to_dict(campaign)


@router.put("/{campaign_id}")
def update_campaign(
    campaign_id: int,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    data = payload.model_dump(exclude_unset=True)

    new_type = data.get("campaign_type", campaign.campaign_type)
    if new_type not in CAMPAIGN_TYPES:
        raise HTTPException(status_code=422, detail="Invalid campaign type")

    new_status = data.get("status", campaign.status)
    if new_status not in CAMPAIGN_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid campaign status")

    start_at = data.get("start_at", campaign.start_at)
    end_at = data.get("end_at", campaign.end_at)
    if start_at and end_at and end_at < start_at:
        raise HTTPException(status_code=422, detail="end_at cannot be earlier than start_at")

    if new_type == "Emergency Alert":
        data["priority"] = "High"

    for key, value in data.items():
        setattr(campaign, key, value)

    db.commit()
    db.refresh(campaign)
    return campaign_to_dict(campaign)


@router.patch("/{campaign_id}/status")
def change_campaign_status(
    campaign_id: int,
    payload: CampaignStatusUpdate,
    db: Session = Depends(get_db),
):
    if payload.status not in CAMPAIGN_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid campaign status")

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.status = payload.status
    db.commit()
    db.refresh(campaign)
    return campaign_to_dict(campaign)


@router.post("/{campaign_id}/clone")
def clone_campaign(campaign_id: int, db: Session = Depends(get_db)):
    original = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Campaign not found")

    clone = Campaign(
        name=f"{original.name} (Copy)",
        description=original.description,
        objective=original.objective,
        campaign_type=original.campaign_type,
        target_segments=list(original.target_segments or []),
        channels=list(original.channels or []),
        priority="High" if original.campaign_type == "Emergency Alert" else original.priority,
        status="Draft",
        created_by=original.created_by,
        start_at=None,
        end_at=None,
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return campaign_to_dict(clone)


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully", "id": campaign_id}