import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.complaint import ComplaintEvent

logger = logging.getLogger(__name__)

class ComplaintEventRepository:
    """Repository handling all database persistence and queries for ComplaintEvent audit trail"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_complaint_id(self, complaint_id: int) -> List[ComplaintEvent]:
        return (
            self.db.query(ComplaintEvent)
            .filter(ComplaintEvent.complaint_id == complaint_id)
            .order_by(desc(ComplaintEvent.created_at))
            .all()
        )

    def get_by_complaint(self, complaint_id: int) -> List[ComplaintEvent]:
        """Alias for get_by_complaint_id"""
        return self.get_by_complaint_id(complaint_id)

    def create(self, event: ComplaintEvent) -> ComplaintEvent:
        self.db.add(event)
        self.db.flush()
        return event

    def log_event(
        self,
        complaint_id: int,
        event_type: str,
        input_text: Optional[str] = None,
        structured_changes: Optional[dict] = None,
        diffs: Optional[dict] = None,
        ai_run_id: Optional[str] = None,
        actor: str = "ai_copilot",
        actor_type: str = "AI"
    ) -> ComplaintEvent:
        """Helper to create and persist an event log within an active transaction"""
        event = ComplaintEvent(
            complaint_id=complaint_id,
            event_type=event_type,
            input_text=input_text,
            structured_changes=structured_changes or {},
            diffs=diffs or {},
            ai_run_id=ai_run_id,
            actor=actor,
            actor_type=actor_type
        )
        return self.create(event)
