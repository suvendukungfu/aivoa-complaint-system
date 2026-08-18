"""
AIVOA API v1 Unified Router
Exposes enterprise pharmaceutical complaint management, AI copilot, analytics, and telemetry.
"""

from fastapi import APIRouter
from backend.app.api.routes import complaints, analytics, health, demo

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(complaints.router)
api_v1_router.include_router(demo.router)
