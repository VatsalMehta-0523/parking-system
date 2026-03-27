from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import logging

from .database import engine, Base
from .routers import users, providers, locations, bookings, analytics
from .services.expiry_service import expire_stale_bookings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Parking Management System",
    version="1.0.0",
    description="AI-Based Hybrid Parking Management API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users.router)
app.include_router(providers.router)
app.include_router(locations.router)
app.include_router(bookings.router)
app.include_router(analytics.router)

# Background scheduler for TTL expiry and overstay detection
scheduler = BackgroundScheduler()
scheduler.add_job(expire_stale_bookings, "interval", minutes=2, id="expiry_job")
scheduler.start()


@app.get("/")
def health_check():
    return {"status": "ok", "service": "Smart Parking API"}


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown(wait=False)
