import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.models.complaint import Complaint
from backend.app.observability.metrics import telemetry_collector

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service providing aggregate QMS metrics and AI Quality telemetry"""

    def __init__(self, db: Session):
        self.db = db

    def get_qms_analytics(self) -> Dict[str, Any]:
        """Aggregate complaint totals, risk profiles, completeness averages, and defect types"""
        total = self.db.query(func.count(Complaint.id)).scalar() or 0
        
        # Severity breakdown
        sev_counts = dict(
            self.db.query(Complaint.severity, func.count(Complaint.id))
            .group_by(Complaint.severity)
            .all()
        )
        
        # Status breakdown
        status_counts = dict(
            self.db.query(Complaint.status, func.count(Complaint.id))
            .group_by(Complaint.status)
            .all()
        )

        # Defect types
        type_counts = dict(
            self.db.query(Complaint.complaint_type, func.count(Complaint.id))
            .filter(Complaint.complaint_type.isnot(None))
            .group_by(Complaint.complaint_type)
            .all()
        )

        # Average completeness
        avg_comp = self.db.query(func.avg(Complaint.completeness_score)).scalar() or 0.0

        # Critical / High counts
        high_critical = (sev_counts.get("Critical", 0) or 0) + (sev_counts.get("High", 0) or 0)
        pending_triage = status_counts.get("Pending Triage", 0) or 0

        # Recent 5 complaints
        recent = (
            self.db.query(Complaint)
            .order_by(desc(Complaint.created_at))
            .limit(5)
            .all()
        )

        return {
            "total_complaints": total,
            "high_critical_count": high_critical,
            "pending_triage_count": pending_triage,
            "avg_completeness": round(float(avg_comp), 1),
            "severity_distribution": {
                "Critical": sev_counts.get("Critical", 0),
                "High": sev_counts.get("High", 0),
                "Medium": sev_counts.get("Medium", 0),
                "Low": sev_counts.get("Low", 0),
            },
            "status_distribution": status_counts,
            "complaint_types": type_counts,
            "recent_activity": [c.to_dict() for c in recent]
        }

    def get_ai_metrics(self) -> Dict[str, Any]:
        """Fetch real-time AI telemetry from collector"""
        return telemetry_collector.get_metrics()
