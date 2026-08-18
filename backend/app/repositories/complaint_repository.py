import logging
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from backend.app.models.complaint import Complaint

logger = logging.getLogger(__name__)

class ComplaintRepository:
    """Repository handling all database persistence and queries for Complaint entity"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, complaint_id: int) -> Optional[Complaint]:
        return self.db.query(Complaint).filter(Complaint.id == complaint_id).first()

    def get_by_number(self, complaint_number: str) -> Optional[Complaint]:
        return self.db.query(Complaint).filter(Complaint.complaint_number == complaint_number).first()

    def get_next_sequence_number(self, year: int) -> str:
        """Generate next atomic complaint ID e.g. CMP-2026-0001"""
        prefix = f"CMP-{year}-"
        last = (
            self.db.query(Complaint.complaint_number)
            .filter(Complaint.complaint_number.like(f"{prefix}%"))
            .order_by(desc(Complaint.id))
            .first()
        )
        if not last or not last[0]:
            return f"{prefix}0001"
        
        try:
            last_seq = int(last[0].split("-")[-1])
            return f"{prefix}{last_seq + 1:04d}"
        except (ValueError, IndexError):
            return f"{prefix}0001"

    def list_paginated(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Complaint], int]:
        """Fetch filtered and paginated list of complaints with total count"""
        query = self.db.query(Complaint)

        if search:
            q_like = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Complaint.complaint_number.ilike(q_like),
                    Complaint.product_name.ilike(q_like),
                    Complaint.batch_number.ilike(q_like),
                    Complaint.customer_name.ilike(q_like),
                    Complaint.detailed_description.ilike(q_like)
                )
            )

        if severity:
            query = query.filter(Complaint.severity == severity)

        if status:
            query = query.filter(Complaint.status == status)

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(desc(Complaint.created_at)).offset(offset).limit(page_size).all()

        return items, total

    def create(self, complaint: Complaint) -> Complaint:
        self.db.add(complaint)
        self.db.flush()
        return complaint

    def update(self, complaint: Complaint) -> Complaint:
        self.db.flush()
        return complaint

    def delete(self, complaint: Complaint) -> None:
        self.db.delete(complaint)
        self.db.flush()
