import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.complaint import ComplaintDocument

logger = logging.getLogger(__name__)

class DocumentRepository:
    """Repository handling all database persistence and queries for ComplaintDocument entity"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, doc_id: int) -> Optional[ComplaintDocument]:
        return self.db.query(ComplaintDocument).filter(ComplaintDocument.id == doc_id).first()

    def get_by_complaint_id(self, complaint_id: int) -> List[ComplaintDocument]:
        return (
            self.db.query(ComplaintDocument)
            .filter(ComplaintDocument.complaint_id == complaint_id)
            .order_by(desc(ComplaintDocument.uploaded_at))
            .all()
        )

    def create(self, document: ComplaintDocument) -> ComplaintDocument:
        self.db.add(document)
        self.db.flush()
        return document
