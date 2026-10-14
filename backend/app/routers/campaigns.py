from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.schemas.campaign import CampaignCreate


router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"]
)


@router.get("/")
def get_campaigns(
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).all()

    return [
        {
            "id": campaign.id,
            "name": campaign.name,
            "description": campaign.description,
            "objective": campaign.objective,
            "status": campaign.status,
            "created_by": campaign.created_by,
            "start_at": campaign.start_at,
            "end_at": campaign.end_at,
            "created_at": campaign.created_at
        }
        for campaign in campaigns
    ]


@router.post("/")
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db)
):
    new_campaign = Campaign(
        name=campaign.name,
        description=campaign.description,
        objective=campaign.objective,
        status=campaign.status,
        created_by=campaign.created_by,
        start_at=campaign.start_at,
        end_at=campaign.end_at
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    return {
        "id": new_campaign.id,
        "name": new_campaign.name,
        "description": new_campaign.description,
        "objective": new_campaign.objective,
        "status": new_campaign.status,
        "created_by": new_campaign.created_by,
        "start_at": new_campaign.start_at,
        "end_at": new_campaign.end_at,
        "created_at": new_campaign.created_at
    }