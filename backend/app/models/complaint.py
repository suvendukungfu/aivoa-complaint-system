import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Index,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Origin & Customer Details
    complaint_source = Column(String(100), nullable=True, default="Direct Email / Portal")
    customer_name = Column(String(200), nullable=True, index=True)
    
    # Product & Batch Identification
    product_name = Column(String(200), nullable=True, index=True)
    product_strength = Column(String(100), nullable=True)
    batch_number = Column(String(100), index=True, nullable=True)
    manufacturing_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    quantity_affected = Column(String(50), nullable=True)
    quantity_unit = Column(String(50), nullable=True, default="kg")
    
    # Complaint Details
    complaint_type = Column(String(150), nullable=True, index=True)
    complaint_date = Column(String(50), nullable=True)
    detailed_description = Column(Text, nullable=True)
    
    # Initial Assessment & Priority
    severity = Column(String(50), nullable=True, default="Medium", index=True)
    priority = Column(String(50), nullable=True, default="Normal")
    
    # AI Metadata & Quality Triage
    ai_confidence = Column(Float, nullable=True, default=0.90)
    ai_reasoning = Column(Text, nullable=True)
    recommended_actions = Column(JSON, nullable=True, default=list)
    completeness_score = Column(Float, nullable=True, default=0.0)
    field_confidence = Column(JSON, nullable=True, default=dict)
    field_provenance = Column(JSON, nullable=True, default=dict)  # Tracks source of each field
    
    # Status & Audit (Pharma QMS Lifecycle)
    status = Column(String(50), nullable=False, default="Pending Triage", index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Table constraints and composite indexes
    __table_args__ = (
        Index("ix_complaints_product_batch", "product_name", "batch_number"),
        Index("ix_complaints_status_severity", "status", "severity"),
        Index("ix_complaints_created_status", "created_at", "status"),
        CheckConstraint("severity IN ('Low', 'Medium', 'High', 'Critical')", name="ck_complaints_severity"),
        CheckConstraint("priority IN ('Low', 'Normal', 'High', 'Urgent')", name="ck_complaints_priority"),
    )

    # Relationships
    events = relationship("ComplaintEvent", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintEvent.created_at.desc()")
    documents = relationship("ComplaintDocument", back_populates="complaint")
    ai_runs = relationship("AIRun", back_populates="complaint")
    proposals = relationship("AIProposal", back_populates="complaint", cascade="all, delete-orphan", order_by="AIProposal.created_at.desc()")

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_number": self.complaint_number,
            "complaint_source": self.complaint_source,
            "customer_name": self.customer_name,
            "product_name": self.product_name,
            "product_strength": self.product_strength,
            "batch_number": self.batch_number,
            "manufacturing_date": self.manufacturing_date,
            "expiry_date": self.expiry_date,
            "quantity_affected": self.quantity_affected,
            "quantity_unit": self.quantity_unit,
            "complaint_type": self.complaint_type,
            "complaint_date": self.complaint_date,
            "detailed_description": self.detailed_description,
            "severity": self.severity,
            "priority": self.priority,
            "ai_confidence": self.ai_confidence,
            "ai_reasoning": self.ai_reasoning,
            "recommended_actions": self.recommended_actions or [],
            "completeness_score": self.completeness_score,
            "field_confidence": self.field_confidence or {},
            "field_provenance": self.field_provenance or {},
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "events": [e.to_dict() for e in self.events] if self.events else [],
            "proposals": [p.to_dict() for p in self.proposals] if self.proposals else []
        }


class ComplaintEvent(Base):
    __tablename__ = "complaint_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # COMPLAINT_CREATED, DOCUMENT_EXTRACTED, AI_EDIT, RISK_RECALCULATED, COMPLETENESS_CHECK, USER_APPROVAL
    input_text = Column(Text, nullable=True)
    structured_changes = Column(JSON, nullable=True)
    diffs = Column(JSON, nullable=True)
    ai_run_id = Column(String(50), nullable=True, index=True)
    actor = Column(String(100), nullable=False, default="ai_copilot")
    actor_type = Column(String(50), nullable=False, default="AI")  # AI | USER | SYSTEM
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_events_complaint_created", "complaint_id", "created_at"),
    )

    complaint = relationship("Complaint", back_populates="events")

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "event_type": self.event_type,
            "input_text": self.input_text,
            "structured_changes": self.structured_changes or {},
            "diffs": self.diffs or {},
            "ai_run_id": self.ai_run_id,
            "actor": self.actor,
            "actor_type": self.actor_type,
            "created_at": self.created_at.strftime("%d %B %Y %H:%M:%S UTC") if self.created_at else None
        }


class ComplaintDocument(Base):
    __tablename__ = "complaint_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), nullable=True, index=True)  # SHA-256 content hash
    document_version = Column(Integer, nullable=False, default=1)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=True)
    evidence_spans = Column(JSON, nullable=True, default=list)  # Highlightable extracted spans
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    complaint = relationship("Complaint", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "filename": self.filename,
            "file_hash": self.file_hash,
            "document_version": self.document_version,
            "content_type": self.content_type,
            "file_size": self.file_size,
            "evidence_spans": self.evidence_spans or [],
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class AIRun(Base):
    __tablename__ = "ai_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ai_run_id = Column(String(50), unique=True, index=True, nullable=False)
    request_id = Column(String(50), index=True, nullable=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True, index=True)
    workflow = Column(String(50), nullable=False)  # INTAKE | EDIT | RISK | SUMMARY | DOCUMENT
    requested_model = Column(String(100), nullable=False)
    actual_model = Column(String(100), nullable=False)
    prompt_version = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="SUCCESS")  # SUCCESS | FALLBACK | ERROR
    latency_ms = Column(Integer, nullable=False, default=0)
    retry_count = Column(Integer, nullable=False, default=0)
    fallback_used = Column(Boolean, nullable=False, default=False)
    fallback_reason = Column(Text, nullable=True)
    validation_status = Column(String(50), nullable=False, default="VALID")
    input_tokens = Column(Integer, nullable=True, default=0)
    output_tokens = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_ai_runs_workflow_created", "workflow", "created_at"),
    )

    complaint = relationship("Complaint", back_populates="ai_runs")

    def to_dict(self):
        return {
            "id": self.id,
            "ai_run_id": self.ai_run_id,
            "request_id": self.request_id,
            "complaint_id": self.complaint_id,
            "workflow": self.workflow,
            "requested_model": self.requested_model,
            "actual_model": self.actual_model,
            "prompt_version": self.prompt_version,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "retry_count": self.retry_count,
            "fallback_used": self.fallback_used,
            "fallback_reason": self.fallback_reason,
            "validation_status": self.validation_status,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AIProposal(Base):
    __tablename__ = "ai_proposals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proposal_id = Column(String(50), unique=True, index=True, nullable=False)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_run_id = Column(String(50), nullable=True, index=True)
    proposal_type = Column(String(50), nullable=False, default="FIELD_MUTATION")  # RISK_SEVERITY | RISK_PRIORITY | FIELD_EXTRACTION | EDIT_INSTRUCTION | RECOMMENDED_ACTION
    field_name = Column(String(100), nullable=False)
    current_value = Column(Text, nullable=True)
    proposed_value = Column(Text, nullable=False)
    proposed_changes = Column(JSON, nullable=True, default=dict)
    reason = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)
    source = Column(String(100), nullable=False, default="AI Risk Assessment")
    confidence_score = Column(Float, nullable=False, default=0.95)
    status = Column(String(50), nullable=False, default="PROPOSED", index=True)  # PROPOSED | APPROVED | REJECTED | MODIFIED | APPLIED
    reviewer_decision = Column(Text, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_proposals_complaint_status", "complaint_id", "status"),
    )

    complaint = relationship("Complaint", back_populates="proposals")

    def to_dict(self):
        return {
            "id": self.id,
            "proposal_id": self.proposal_id,
            "complaint_id": self.complaint_id,
            "ai_run_id": self.ai_run_id,
            "proposal_type": self.proposal_type,
            "field_name": self.field_name,
            "current_value": self.current_value,
            "proposed_value": self.proposed_value,
            "proposed_changes": self.proposed_changes or {self.field_name: self.proposed_value},
            "reason": self.reason,
            "evidence": self.evidence,
            "source": self.source,
            "confidence_score": self.confidence_score,
            "status": self.status,
            "reviewer_decision": self.reviewer_decision,
            "reviewer_notes": self.reviewer_notes,
            "rejection_reason": self.rejection_reason or self.reviewer_notes,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
