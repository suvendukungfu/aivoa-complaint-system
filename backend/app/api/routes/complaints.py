import logging
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.services.complaint_service import ComplaintService
from backend.app.services.document_service import DocumentService
from backend.app.services.ai_service import AIService
from backend.app.services.duplicate_detector import find_duplicate_complaint
from backend.app.agents.providers import get_llm_provider
from backend.app.agents.nodes import (
    calculate_deterministic_risk,
    calculate_deterministic_completeness
)
from backend.app.agents.prompts import SUMMARY_SYSTEM_PROMPT
from backend.app.schemas.complaint import (
    LogComplaintRequest,
    EditComplaintRequest,
    CompletenessRequest,
    RiskAssessmentRequest,
    SummaryRequest,
    DuplicateCheckRequest,
    ComplaintData,
    AIResponse,
    SaveComplaintResponse,
    RiskAssessment,
    CompletenessAssessment,
    DuplicateMatch,
    SummaryResponse,
    PaginatedComplaintList,
    AIProposalSchema,
    ProposalDecisionRequest,
    ProposalDecisionResponse,
    ProposalApproveRequest,
    ProposalRejectRequest,
    ProposalModifyRequest,
    ReviewerDashboardResponse,
    StateTransitionRequest,
    StateTransitionResponse,
    AuditTimelineResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/complaints", tags=["Complaints & AI Copilot"])

@router.get("", response_model=PaginatedComplaintList)
def list_complaints(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query across product, batch, customer, number"),
    severity: Optional[str] = Query(None, description="Filter by severity: Low, Medium, High, Critical"),
    status: Optional[str] = Query(None, description="Filter by status: Pending Triage, Under Investigation, etc."),
    db: Session = Depends(get_db)
):
    """Retrieve filtered and paginated complaint records"""
    service = ComplaintService(db)
    items, total = service.list_complaints(
        page=page,
        page_size=page_size,
        search=search,
        severity=severity,
        status=status
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedComplaintList(
        items=[ComplaintData(**c.to_dict()) for c in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages
    )

@router.get("/{complaint_id}", response_model=ComplaintData)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Retrieve single complaint record by ID with audit event history"""
    service = ComplaintService(db)
    complaint = service.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return ComplaintData(**complaint.to_dict())

@router.post("/log", response_model=AIResponse)
def log_complaint_via_nlp(req: LogComplaintRequest, request: Request, db: Session = Depends(get_db)):
    """Process natural-language complaint text through LangGraph agent pipeline"""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty.")
    
    req_id = getattr(request.state, "request_id", None)
    result = AIService.process_complaint_text(
        text=req.text,
        source="customer_prompt",
        request_id=req_id
    )
    
    complaint_data = result.get("final_complaint", {})
    risk_data = result.get("risk_assessment", {})
    completeness_data = result.get("completeness", {})
    
    # Check for potential duplicates in DB
    dup_warning = find_duplicate_complaint(complaint_data, db)
    
    return AIResponse(
        success=True,
        message=result.get("response_message", "Complaint analyzed successfully."),
        complaint=ComplaintData(**complaint_data),
        updated_fields=result.get("updated_fields", []),
        audit_trail=result.get("audit_trail", []),
        risk_assessment=RiskAssessment(**risk_data) if risk_data else None,
        completeness=CompletenessAssessment(**completeness_data) if completeness_data else None,
        duplicate_warning=(DuplicateMatch(**dup_warning) if isinstance(dup_warning, dict) else dup_warning) if dup_warning else None
    )

@router.post("/edit", response_model=AIResponse)
def edit_complaint_via_nlp(req: EditComplaintRequest, request: Request, db: Session = Depends(get_db)):
    """Apply safe natural-language patch edits to an existing complaint record"""
    if not req.instruction or not req.instruction.strip():
        raise HTTPException(status_code=400, detail="Edit instruction cannot be empty.")
        
    current_dict = req.current_complaint.model_dump()
    req_id = getattr(request.state, "request_id", None)
    
    result = AIService.process_complaint_edit(
        instruction=req.instruction,
        current_complaint=current_dict,
        request_id=req_id
    )
    
    complaint_data = result.get("final_complaint", current_dict)
    
    # Recalculate deterministic risk and completeness on updated state
    risk_data = calculate_deterministic_risk(complaint_data)
    completeness_data = calculate_deterministic_completeness(complaint_data)
    
    return AIResponse(
        success=True,
        message=result.get("response_message", "Complaint updated successfully."),
        complaint=ComplaintData(**complaint_data),
        updated_fields=result.get("updated_fields", []),
        audit_trail=result.get("audit_trail", []),
        risk_assessment=RiskAssessment(**risk_data),
        completeness=CompletenessAssessment(**completeness_data)
    )

@router.post("/extract-document", response_model=AIResponse)
@router.post("/extract", response_model=AIResponse)
async def extract_document_complaint(
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Upload and extract pharmaceutical complaint from PDF, DOCX, TXT, or EML document"""
    doc_service = DocumentService(db)
    filename, text, file_size, content_type, pages, file_hash = await doc_service.process_and_extract_document(file)
    
    req_id = getattr(request.state, "request_id", None) if request else None
    result = AIService.process_complaint_text(
        text=text,
        source="uploaded_document",
        request_id=req_id,
        pages=pages,
        document_filename=filename
    )
    
    complaint_data = result.get("final_complaint", {})
    risk_data = result.get("risk_assessment", {})
    completeness_data = result.get("completeness", {})
    
    dup_warning = find_duplicate_complaint(complaint_data, db)
    
    return AIResponse(
        success=True,
        message=f"📄 Extracted complaint from '{filename}' ({file_size} bytes, SHA-256: {file_hash[:8]}...).\n\n" + result.get("response_message", ""),
        complaint=ComplaintData(**complaint_data),
        updated_fields=result.get("updated_fields", []),
        audit_trail=result.get("audit_trail", []),
        risk_assessment=RiskAssessment(**risk_data) if risk_data else None,
        completeness=CompletenessAssessment(**completeness_data) if completeness_data else None,
        duplicate_warning=(DuplicateMatch(**dup_warning) if isinstance(dup_warning, dict) else dup_warning) if dup_warning else None
    )

@router.post("", response_model=SaveComplaintResponse)
@router.post("/save", response_model=SaveComplaintResponse)
def save_complaint(complaint: ComplaintData, db: Session = Depends(get_db)):
    """Persist or update complaint record atomically with audit trail"""
    data = complaint.model_dump()
    service = ComplaintService(db)
    
    try:
        saved_entity, is_new = service.save_or_create_complaint(data, actor="qa_specialist")
        
        # If new complaint, auto-generate AI proposals for Quality Review workflow
        if is_new and saved_entity.severity:
            proposals = [
                {
                    "proposal_type": "RISK_SEVERITY",
                    "field_name": "severity",
                    "current_value": "Medium",
                    "proposed_value": saved_entity.severity,
                    "reason": saved_entity.ai_reasoning or f"AI Risk Assessment calculated {saved_entity.severity} severity based on defect classification.",
                    "source": "AI Risk Assessment",
                    "confidence_score": saved_entity.ai_confidence or 0.95
                }
            ]
            if saved_entity.priority:
                proposals.append({
                    "proposal_type": "RISK_PRIORITY",
                    "field_name": "priority",
                    "current_value": "Normal",
                    "proposed_value": saved_entity.priority,
                    "reason": f"AI Priority Engine determined {saved_entity.priority} response tier.",
                    "source": "AI Risk Assessment",
                    "confidence_score": saved_entity.ai_confidence or 0.92
                })
            service.create_ai_proposals(saved_entity.id, proposals, ai_run_id="AI-93D22C")

        action_str = "created" if is_new else "updated"
        return SaveComplaintResponse(
            success=True,
            id=saved_entity.id,
            complaint_number=saved_entity.complaint_number,
            status=saved_entity.status,
            message=f"Complaint {saved_entity.complaint_number} {action_str} successfully.",
            created_at=saved_entity.created_at.strftime("%d %B %Y %H:%M UTC")
        )
    except Exception as e:
        logger.error(f"Error saving complaint: {e}")
        raise HTTPException(status_code=500, detail=f"Database transaction error: {str(e)}")

@router.post("/completeness", response_model=CompletenessAssessment)
def evaluate_completeness(req: CompletenessRequest):
    """Evaluate QMS complaint completeness score and identify missing fields"""
    comp = calculate_deterministic_completeness(req.complaint.model_dump())
    return CompletenessAssessment(**comp)

@router.post("/risk", response_model=RiskAssessment)
@router.post("/risk-assessment", response_model=RiskAssessment)
def evaluate_risk(req: RiskAssessmentRequest):
    """Run deterministic QMS risk triage calculation"""
    risk = calculate_deterministic_risk(req.complaint.model_dump())
    return RiskAssessment(**risk)

@router.post("/summary", response_model=SummaryResponse)
def generate_summary(req: SummaryRequest):
    """Generate executive summary for Quality Review Board using LLM or deterministic fallback"""
    c = req.complaint
    provider = get_llm_provider()
    
    if provider.is_available():
        try:
            prompt = f"""Generate an executive summary for this complaint:
Customer: {c.customer_name or 'Unknown'}
Product: {c.product_name or 'Unspecified'} ({c.product_strength or 'Standard'})
Batch Number: {c.batch_number or 'Unspecified'}
Manufacturing Date: {c.manufacturing_date or 'N/A'} | Expiry: {c.expiry_date or 'N/A'}
Quantity Affected: {c.quantity_affected or 'N/A'} {c.quantity_unit or ''}
Complaint Type: {c.complaint_type or 'General'}
Description: {c.detailed_description or 'No details provided'}
Severity: {c.severity or 'Medium'} | Priority: {c.priority or 'Normal'}
"""
            messages = [
                SystemMessage(content=SUMMARY_SYSTEM_PROMPT),
                HumanMessage(content=prompt)
            ]
            content, _, _ = provider.invoke(messages)
            if content:
                return SummaryResponse(summary=content.strip())
        except Exception as e:
            logger.warning(f"Executive summary generation failed ({e}). Using deterministic fallback.")
            
    # Deterministic summary fallback
    summary_text = f"""### 📋 Executive Complaint Summary

* **Customer:** {c.customer_name or 'Unknown Customer'}
* **Product:** {c.product_name or 'Unspecified'} {c.product_strength or ''}
* **Batch / Lot:** `{c.batch_number or 'N/A'}`
* **Quantity Affected:** {c.quantity_affected or 'N/A'} {c.quantity_unit or 'kg'}
* **Classification:** {c.complaint_type or 'Quality Defect'}
* **Severity / Priority:** `{c.severity or 'Medium'}` / `{c.priority or 'Normal'}`

#### 🔬 Incident Description
{c.detailed_description or 'No detailed description provided.'}

#### ⚡ Risk Assessment & Containment
* **Initial Triage Rationale:** {c.ai_reasoning or 'Standard quality investigation required.'}
* **Immediate Actions:**
"""
    actions = c.recommended_actions or [
        "Quarantine affected batch in distribution center",
        "Initiate formal Level-2 Quality Deviation investigation",
        "Review Batch Manufacturing Record (BMR) execution logs"
    ]
    for a in actions:
        summary_text += f"  - {a}\n"
        
    summary_text += "\n> ⚠️ *AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel.*"
    return SummaryResponse(summary=summary_text)

@router.post("/check-duplicate", response_model=Optional[DuplicateMatch])
@router.post("/duplicates", response_model=Optional[DuplicateMatch])
def check_duplicate(req: DuplicateCheckRequest, db: Session = Depends(get_db)):
    """Check if complaint matches an existing batch or defect in the database"""
    match = find_duplicate_complaint(req.complaint.model_dump(), db)
    if match:
        return DuplicateMatch(**match)
    return None

@router.get("/states/metadata")
def get_states_metadata():
    """Retrieve QMS complaint lifecycle states, allowed transitions, and metadata"""
    from backend.app.agents.statemachine import ComplaintStateMachine
    return {
        "states": ComplaintStateMachine.STATE_METADATA,
        "allowed_transitions": {
            s.value: [t.value for t in targets]
            for s, targets in ComplaintStateMachine.ALLOWED_TRANSITIONS.items()
        }
    }

@router.post("/{complaint_id}/transition", response_model=StateTransitionResponse)
def transition_complaint(
    complaint_id: int,
    req: StateTransitionRequest,
    db: Session = Depends(get_db)
):
    """Validate and transition a complaint through the QMS lifecycle state machine"""
    service = ComplaintService(db)
    try:
        updated = service.transition_complaint_state(
            complaint_id=complaint_id,
            target_state=req.target_state,
            actor=req.actor_id,
            actor_role=req.actor_role,
            reason=req.reason
        )
        return StateTransitionResponse(
            success=True,
            message=f"Complaint transitioned successfully to {updated.status}",
            previous_state=req.target_state,
            new_state=updated.status,
            complaint=ComplaintData(**updated.to_dict())
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during state transition: {e}")
        raise HTTPException(status_code=500, detail=f"State transition error: {str(e)}")

@router.get("/dashboard/review", response_model=ReviewerDashboardResponse)
def get_reviewer_dashboard(db: Session = Depends(get_db)):
    """Retrieve aggregate real-time quality reviewer dashboard metrics"""
    from backend.app.repositories.proposal_repository import AIProposalRepository
    repo = AIProposalRepository(db)
    metrics = repo.get_reviewer_dashboard_metrics()
    return ReviewerDashboardResponse(**metrics)

@router.get("/{complaint_id}/proposals", response_model=List[AIProposalSchema])
def get_complaint_proposals(
    complaint_id: int,
    status: Optional[str] = Query(None, description="Filter by status: PROPOSED, AI_PROPOSED, APPROVED, REJECTED, MODIFIED, APPLIED"),
    db: Session = Depends(get_db)
):
    """Retrieve AI proposed changes for a given complaint"""
    from backend.app.repositories.proposal_repository import AIProposalRepository
    repo = AIProposalRepository(db)
    proposals = repo.list_by_complaint(complaint_id, status=status)
    return [AIProposalSchema(**p.to_dict()) for p in proposals]

@router.post("/{complaint_id}/proposals/{proposal_id}/approve", response_model=ProposalDecisionResponse)
@router.post("/proposals/{proposal_id}/approve", response_model=ProposalDecisionResponse)
def approve_proposal(
    proposal_id: str,
    complaint_id: Optional[int] = None,
    req: Optional[ProposalApproveRequest] = None,
    db: Session = Depends(get_db)
):
    """Approve an AI proposal and apply changes atomically"""
    body = req or ProposalApproveRequest()
    service = ComplaintService(db)
    proposal, complaint = service.decide_ai_proposal(
        proposal_id_str=proposal_id,
        decision="APPROVE",
        notes=body.notes,
        reviewer_id=body.reviewer_id,
        reviewer_role=body.reviewer_role
    )
    return ProposalDecisionResponse(
        success=True,
        message=f"Proposal {proposal_id} approved and applied successfully",
        proposal=AIProposalSchema(**proposal.to_dict()),
        complaint=ComplaintData(**complaint.to_dict())
    )

@router.post("/{complaint_id}/proposals/{proposal_id}/reject", response_model=ProposalDecisionResponse)
@router.post("/proposals/{proposal_id}/reject", response_model=ProposalDecisionResponse)
def reject_proposal(
    proposal_id: str,
    req: ProposalRejectRequest,
    complaint_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Reject an AI proposal with mandatory documented justification"""
    service = ComplaintService(db)
    proposal, complaint = service.decide_ai_proposal(
        proposal_id_str=proposal_id,
        decision="REJECT",
        notes=req.reason,
        reviewer_id=req.reviewer_id,
        reviewer_role=req.reviewer_role
    )
    return ProposalDecisionResponse(
        success=True,
        message=f"Proposal {proposal_id} rejected",
        proposal=AIProposalSchema(**proposal.to_dict()),
        complaint=ComplaintData(**complaint.to_dict())
    )

@router.post("/{complaint_id}/proposals/{proposal_id}/modify", response_model=ProposalDecisionResponse)
@router.post("/proposals/{proposal_id}/modify", response_model=ProposalDecisionResponse)
def modify_proposal(
    proposal_id: str,
    req: ProposalModifyRequest,
    complaint_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Human Override: Modify AI proposal with reviewer-specified value and rationale"""
    service = ComplaintService(db)
    proposal, complaint = service.decide_ai_proposal(
        proposal_id_str=proposal_id,
        decision="MODIFY",
        human_value=req.human_value,
        notes=req.reason,
        reviewer_id=req.reviewer_id,
        reviewer_role=req.reviewer_role
    )
    return ProposalDecisionResponse(
        success=True,
        message=f"Proposal {proposal_id} modified to '{req.human_value}' and applied",
        proposal=AIProposalSchema(**proposal.to_dict()),
        complaint=ComplaintData(**complaint.to_dict())
    )

@router.post("/proposals/{proposal_id}/decide", response_model=ProposalDecisionResponse)
def decide_proposal(
    proposal_id: str,
    req: ProposalDecisionRequest,
    db: Session = Depends(get_db)
):
    """Generic Quality Reviewer decision (Approve, Reject, or Modify) on an AI Proposal"""
    service = ComplaintService(db)
    proposal, complaint = service.decide_ai_proposal(
        proposal_id_str=proposal_id,
        decision=req.decision,
        human_value=req.human_value,
        notes=req.reason or req.notes,
        reviewer_id=req.reviewer_id,
        reviewer_role=req.reviewer_role
    )
    return ProposalDecisionResponse(
        success=True,
        message=f"Proposal {proposal_id} {req.decision.lower()}ed successfully",
        proposal=AIProposalSchema(**proposal.to_dict()),
        complaint=ComplaintData(**complaint.to_dict())
    )

@router.get("/{complaint_id}/timeline", response_model=AuditTimelineResponse)
def get_complaint_timeline(complaint_id: int, db: Session = Depends(get_db)):
    """Retrieve chronological audit timeline with AI vs Human actor attribution"""
    service = ComplaintService(db)
    timeline = service.get_audit_timeline(complaint_id)
    return AuditTimelineResponse(**timeline)

