from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ComplaintData(BaseModel):
    id: Optional[int] = None
    complaint_number: Optional[str] = None
    
    # Origin & Customer Details
    complaint_source: Optional[str] = Field(default="Customer Direct / Email")
    customer_name: Optional[str] = None
    
    # Product & Batch Identification
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    quantity_unit: Optional[str] = Field(default="kg")
    
    # Complaint Details
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    detailed_description: Optional[str] = None
    
    # Initial Assessment & Priority
    severity: Optional[str] = Field(default="Medium")
    priority: Optional[str] = Field(default="Normal")
    
    # AI Quality Triage & Metadata
    ai_confidence: Optional[float] = Field(default=0.92)
    ai_reasoning: Optional[str] = None
    recommended_actions: Optional[List[str]] = Field(default_factory=list)
    completeness_score: Optional[float] = Field(default=0.0)
    field_confidence: Optional[Dict[str, float]] = Field(default_factory=dict)
    field_provenance: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Status
    status: Optional[str] = Field(default="Pending Triage")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    events: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    proposals: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class StepAuditLog(BaseModel):
    step_name: str
    description: str
    status: str = "completed"  # completed, in_progress, skipped, error
    timestamp: str

class FieldEvidenceItem(BaseModel):
    field: str
    value: Optional[Any] = None
    source_type: str = "customer_prompt"  # uploaded_document | customer_prompt | user_edit | ai_inference | deterministic_rule
    source_document_id: Optional[str] = None
    page_number: Optional[int] = None  # ONLY populated when known
    text_span: Optional[str] = None  # Verbatim exact text span or None
    confidence: float = 0.95
    ai_run_id: Optional[str] = None
    classification: str = "EXPLICIT_EXTRACTED"  # EXPLICIT_EXTRACTED | INFERRED | USER_SPECIFIED
    updated_at: Optional[str] = None

class RiskEvidenceItem(BaseModel):
    risk_factor: str
    severity_impact: str = "High"
    evidence: str
    source: str = "Customer complaint text"
    page_number: Optional[int] = None
    classification: str = "EXPLICIT_EXTRACTED"

class RiskAssessment(BaseModel):
    severity: str = "Medium"  # Low, Medium, High, Critical
    priority: str = "Normal"  # Low, Normal, High, Urgent
    risk_rationale: str
    recommended_actions: List[str]
    disclaimer: str = "AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel."
    evidence_grounding: Optional[List[RiskEvidenceItem]] = Field(default_factory=list)

class CompletenessAssessment(BaseModel):
    completeness_score: float
    missing_critical_fields: List[str]
    missing_optional_fields: List[str]
    recommendations: List[str]

class DuplicateMatch(BaseModel):
    complaint_number: str
    similarity: float
    reason: str
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    severity: Optional[str] = None
    created_at: Optional[str] = None

class LogComplaintRequest(BaseModel):
    text: str

class EditComplaintRequest(BaseModel):
    instruction: str
    current_complaint: ComplaintData

class CompletenessRequest(BaseModel):
    complaint: ComplaintData

class RiskAssessmentRequest(BaseModel):
    complaint: ComplaintData

class SummaryRequest(BaseModel):
    complaint: ComplaintData

class DuplicateCheckRequest(BaseModel):
    complaint: ComplaintData

class AIResponse(BaseModel):
    success: bool = True
    message: str
    complaint: ComplaintData
    updated_fields: List[str] = Field(default_factory=list)
    audit_trail: List[StepAuditLog] = Field(default_factory=list)
    risk_assessment: Optional[RiskAssessment] = None
    completeness: Optional[CompletenessAssessment] = None
    duplicate_warning: Optional[DuplicateMatch] = None

class SaveComplaintResponse(BaseModel):
    success: bool = True
    id: int
    complaint_number: str
    status: str
    message: str
    created_at: str

class PaginatedComplaintList(BaseModel):
    items: List[ComplaintData]
    page: int
    page_size: int
    total: int
    total_pages: int

class SummaryResponse(BaseModel):
    summary: str

class AIProposalSchema(BaseModel):
    id: Optional[int] = None
    proposal_id: str
    complaint_id: int
    ai_run_id: Optional[str] = None
    proposal_type: str  # RISK_SEVERITY | RISK_PRIORITY | FIELD_EXTRACTION | EDIT_INSTRUCTION | RECOMMENDED_ACTION
    field_name: str
    current_value: Optional[str] = None
    proposed_value: str
    reason: Optional[str] = None
    source: str = "AI Risk Assessment"
    confidence_score: float = 0.95
    status: str = "AI_PROPOSED"  # AI_PROPOSED | APPROVED | REJECTED | MODIFIED | APPLIED
    reviewer_decision: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None

class ProposalApproveRequest(BaseModel):
    notes: Optional[str] = "Approved by Quality Reviewer"
    reviewer_id: str = "qa_reviewer"
    reviewer_role: str = "QUALITY_REVIEWER"

class ProposalRejectRequest(BaseModel):
    reason: str  # Mandatory reason for rejection
    reviewer_id: str = "qa_reviewer"
    reviewer_role: str = "QUALITY_REVIEWER"

class ProposalModifyRequest(BaseModel):
    human_value: str  # Mandatory new value specified by reviewer
    reason: str  # Mandatory rationale for overriding AI
    reviewer_id: str = "qa_reviewer"
    reviewer_role: str = "QUALITY_REVIEWER"

class ProposalDecisionRequest(BaseModel):
    decision: str  # APPROVE | REJECT | MODIFY
    human_value: Optional[str] = None
    notes: Optional[str] = None
    reason: Optional[str] = None
    reviewer_id: str = "qa_reviewer"
    reviewer_role: str = "QUALITY_REVIEWER"

class ProposalDecisionResponse(BaseModel):
    success: bool = True
    message: str
    proposal: AIProposalSchema
    complaint: ComplaintData

class ReviewerDashboardResponse(BaseModel):
    total_proposals: int
    pending_ai_reviews: int
    approved_proposals: int
    rejected_proposals: int
    human_overrides: int
    ai_override_rate_pct: float
    ai_acceptance_rate_pct: float
    high_critical_complaints: int
    average_review_time_seconds: int

class StateTransitionRequest(BaseModel):
    target_state: str
    reason: Optional[str] = None
    actor_id: str = "qa_reviewer"
    actor_role: str = "QUALITY_REVIEWER"

class StateTransitionResponse(BaseModel):
    success: bool = True
    message: str
    previous_state: str
    new_state: str
    complaint: ComplaintData

class AuditTimelineEvent(BaseModel):
    id: Optional[int] = None
    timestamp: str
    time_str: str
    event_type: str
    title: str
    description: str
    actor: str
    actor_type: str  # AI | HUMAN | SYSTEM
    ai_run_id: Optional[str] = None
    before_value: Optional[Any] = None
    after_value: Optional[Any] = None
    diffs: Optional[Dict[str, Any]] = None

class AuditTimelineResponse(BaseModel):
    complaint_number: str
    current_status: str
    events: List[AuditTimelineEvent]
