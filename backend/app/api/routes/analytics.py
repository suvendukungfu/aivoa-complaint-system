from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["QMS Analytics & AI Metrics"])

@router.get("")
def get_qms_analytics(db: Session = Depends(get_db)):
    """Fetch aggregate pharmaceutical complaint metrics and distribution"""
    service = AnalyticsService(db)
    return service.get_qms_analytics()

@router.get("/ai-metrics")
def get_ai_metrics(db: Session = Depends(get_db)):
    """Fetch real-time AI performance, latency p95, and success rate telemetry"""
    service = AnalyticsService(db)
    return service.get_ai_metrics()
