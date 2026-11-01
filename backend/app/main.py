
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

# Existing routers
from app.routers.users import router as users_router
from app.routers.audience import router as audience_router
from app.routers.campaigns import router as campaigns_router
from app.routers.templates import router as templates_router
from app.routers.messages import router as messages_router
from app.routers.delivery_logs import router as delivery_logs_router
from app.routers.feedback import router as feedback_router
from app.routers.segment import router as segments_router
from app.routers.auth import router as auth_router

# AI feature routers
from app.routers import ai
from app.routers import translation
from app.routers import personalization
from app.routers import drafts

# Task 11: AI review and compliance
from app.routers import review

# Task 12: End-to-end content pipeline
from app.routers import content_pipeline

# Register AI models
from app.models import generated_content
from app.models import content_translation
from app.models import content_variant

# New models will be imported here after their files are created.
# from app.models import compliance_rule
# from app.models import content_approval
# from app.models import campaign_content

app = FastAPI(
    title="AI PublicConnect",
    description=(
        "AI-powered multilingual public awareness "
        "and mass communication platform"
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing application routers
app.include_router(users_router)
app.include_router(audience_router)
app.include_router(campaigns_router)
app.include_router(templates_router)
app.include_router(messages_router)
app.include_router(delivery_logs_router)
app.include_router(feedback_router)
app.include_router(segments_router)
app.include_router(auth_router)
app.include_router(drafts.router)

# AI routers
app.include_router(ai.router)
app.include_router(translation.router)
app.include_router(personalization.router)

# Task 11 and Task 12
app.include_router(review.router)
app.include_router(content_pipeline.router)


@app.on_event("startup")
def create_ai_tables():
    """Create registered AI-related tables."""
    Base.metadata.create_all(
        bind=engine,
        tables=[
            generated_content.GeneratedContent.__table__,
            content_translation.ContentTranslation.__table__,
            content_variant.ContentVariant.__table__,
        ],
    )


@app.get("/")
def home():
    return {
        "message": "Welcome to AI PublicConnect API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "AI PublicConnect backend is running",
    }
