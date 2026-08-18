import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.db.session import get_db, get_active_db_type
from backend.app.agents.providers import get_llm_provider
from backend.app.observability.metrics import telemetry_collector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health & Probes"])

@router.get("", status_code=status.HTTP_200_OK)
def general_health(db: Session = Depends(get_db)):
    """General health and operational readiness check with truthful AI telemetry"""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.error(f"Health DB probe failed: {e}")

    provider = get_llm_provider()
    groq_ok = provider.is_available()
    metrics = telemetry_collector.get_metrics()

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "aivoa-backend",
        "version": settings.API_VERSION,
        "database_connected": db_ok,
        "database_type": get_active_db_type(),
        "groq_configured": groq_ok,
        "ai_model": settings.GROQ_MODEL,
        "environment": settings.ENVIRONMENT,
        "ai": {
            "provider": "groq",
            "requested_model": settings.GROQ_MODEL,
            "configured_model": settings.GROQ_MODEL,
            "fallback_configured": settings.GROQ_FALLBACK_MODEL,
            "last_successful_model": metrics.get("last_successful_model"),
            "last_successful_provider": metrics.get("last_successful_provider"),
            "fallback": metrics.get("last_fallback_used", False)
        }
    }

@router.get("/live", status_code=status.HTTP_200_OK)
def liveness_probe():
    """Kubernetes / Container Liveness probe (checks process is running)"""
    return {"status": "live", "service": "aivoa-backend"}

@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_probe(db: Session = Depends(get_db)):
    """Kubernetes / Container Readiness probe (verifies database dependency)"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "reason": str(e)}
        )
