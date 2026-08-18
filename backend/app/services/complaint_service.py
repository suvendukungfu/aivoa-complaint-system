import datetime
import logging
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.models.complaint import Complaint, ComplaintEvent, AIProposal
from backend.app.repositories.complaint_repository import ComplaintRepository
from backend.app.repositories.event_repository import ComplaintEventRepository

logger = logging.getLogger(__name__)

class ComplaintService:
    """Domain Service handling Complaint business logic, transactions, and event audit trails"""

    def __init__(self, db: Session):
        self.db = db
        self.complaint_repo = ComplaintRepository(db)
        self.event_repo = ComplaintEventRepository(db)

    def get_complaint(self, complaint_id: int) -> Optional[Complaint]:
        return self.complaint_repo.get_by_id(complaint_id)

    def list_complaints(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Complaint], int]:
        return self.complaint_repo.list_paginated(
            page=page,
            page_size=page_size,
            search=search,
            severity=severity,
            status=status
        )

    def save_or_create_complaint(
        self,
        payload: Dict[str, Any],
        actor: str = "ai_copilot"
    ) -> Tuple[Complaint, bool]:
        """
        Atomically persist or update a complaint and record an immutable audit event.
        Guarantees rollback on any failure.
        """
        year = datetime.datetime.utcnow().year
        complaint_id = payload.get("id")
        is_new = True

        try:
            if complaint_id:
                complaint = self.complaint_repo.get_by_id(complaint_id)
                if complaint:
                    is_new = False
                    # Update fields
                    for k, v in payload.items():
                        if hasattr(complaint, k) and k not in ["id", "complaint_number", "created_at"]:
                            setattr(complaint, k, v)
                    complaint = self.complaint_repo.update(complaint)
                else:
                    complaint = self._create_new_entity(payload, year)
            else:
                complaint = self._create_new_entity(payload, year)

            # Record audit event
            event_type = "COMPLAINT_CREATED" if is_new else "COMPLAINT_UPDATED"
            self.event_repo.log_event(
                complaint_id=complaint.id,
                event_type=event_type,
                input_text=payload.get("detailed_description"),
                structured_changes=payload,
                actor=actor
            )

            self.db.commit()
            self.db.refresh(complaint)
            logger.info(f"Atomically saved complaint {complaint.complaint_number} (ID: {complaint.id})")
            return complaint, is_new

        except Exception as e:
            self.db.rollback()
            logger.error(f"Transaction failed while saving complaint: {e}")
            raise

    def log_complaint_activity(
        self,
        complaint_id: int,
        event_type: str,
        input_text: Optional[str] = None,
        changes: Optional[dict] = None,
        actor: str = "ai_copilot"
    ) -> ComplaintEvent:
        """Log an atomic audit event on a complaint"""
        try:
            event = self.event_repo.log_event(
                complaint_id=complaint_id,
                event_type=event_type,
                input_text=input_text,
                structured_changes=changes,
                actor=actor
            )
            self.db.commit()
            return event
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to log complaint activity: {e}")
            raise

    def transition_complaint_state(
        self,
        complaint_id: int,
        target_state: str,
        actor: str = "qa_reviewer",
        actor_type: str = "HUMAN",
        actor_role: str = "QUALITY_REVIEWER",
        reason: Optional[str] = None
    ) -> Complaint:
        """Validate and apply state transition on complaint according to ComplaintStateMachine with RBAC"""
        from backend.app.agents.statemachine import ComplaintStateMachine, InvalidStateTransitionError, ComplaintStatus
        from backend.app.core.rbac import AuthorizationService, Permission
        from fastapi import HTTPException, status

        # 1. Enforce RBAC permissions
        AuthorizationService.enforce(actor_role, Permission.CHANGE_STATUS, actor)
        target_enum = ComplaintStateMachine.normalize_status(target_state)
        if target_enum == ComplaintStatus.CLOSED:
            AuthorizationService.enforce(actor_role, Permission.CLOSE_COMPLAINT, actor)

        complaint = self.complaint_repo.get_by_id(complaint_id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "COMPLAINT_NOT_FOUND", "message": f"Complaint {complaint_id} not found."}}
            )

        try:
            prev_state, new_state = ComplaintStateMachine.validate_transition(
                current_status=complaint.status,
                target_status=target_state,
                actor_type=actor_type
            )
        except InvalidStateTransitionError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "INVALID_STATE_TRANSITION",
                        "message": str(e),
                        "current_state": complaint.status,
                        "target_state": target_state
                    }
                }
            )

        old_val = complaint.status
        complaint.status = new_state.value
        self.complaint_repo.update(complaint)

        # Record immutable state transition audit event
        self.event_repo.log_event(
            complaint_id=complaint.id,
            event_type="STATE_TRANSITION",
            input_text=reason or f"Transitioned lifecycle state: {old_val} → {new_state.value}",
            structured_changes={"previous_state": old_val, "new_state": new_state.value, "reason": reason},
            diffs={"status": {"before": old_val, "after": new_state.value}},
            actor=actor,
            actor_type=actor_type
        )

        self.db.commit()
        self.db.refresh(complaint)
        logger.info(f"Transitioned complaint {complaint.complaint_number} from {old_val} to {new_state.value} by {actor}")
        return complaint

    def create_ai_proposals(
        self,
        complaint_id: int,
        proposals_data: List[Dict[str, Any]],
        ai_run_id: Optional[str] = None
    ) -> List[AIProposal]:
        """Create AI proposal records for human quality review"""
        from backend.app.models.complaint import AIProposal
        from backend.app.repositories.proposal_repository import AIProposalRepository

        import uuid
        repo = AIProposalRepository(self.db)
        created = []
        for idx, p in enumerate(proposals_data):
            uid_short = uuid.uuid4().hex[:6].upper()
            prop_id = p.get("proposal_id") or f"PROP-{complaint_id}-{ai_run_id or uid_short}-{idx+1:02d}"
            entity = AIProposal(
                proposal_id=prop_id,
                complaint_id=complaint_id,
                ai_run_id=ai_run_id,
                proposal_type=p.get("proposal_type", "FIELD_MUTATION"),
                field_name=p.get("field_name", "severity"),
                current_value=str(p.get("current_value")) if p.get("current_value") is not None else None,
                proposed_value=str(p.get("proposed_value")),
                proposed_changes=p.get("proposed_changes") or {p.get("field_name", "severity"): str(p.get("proposed_value"))},
                reason=p.get("reason"),
                evidence=p.get("evidence"),
                source=p.get("source", "AI Risk Assessment"),
                confidence_score=float(p.get("confidence_score", 0.95)),
                status=p.get("status", "PROPOSED")
            )
            repo.create(entity)
            created.append(entity)

            # Record proposal created audit event
            self.event_repo.log_event(
                complaint_id=complaint_id,
                event_type="AI_PROPOSAL_CREATED",
                input_text=p.get("reason"),
                structured_changes={
                    "proposal_id": prop_id,
                    "field_name": p.get("field_name"),
                    "proposed_value": p.get("proposed_value"),
                    "reason": p.get("reason"),
                    "source": p.get("source")
                },
                diffs={p.get("field_name"): {"before": p.get("current_value"), "after": p.get("proposed_value")}},
                ai_run_id=ai_run_id,
                actor="aivoa_copilot",
                actor_type="AI"
            )

        self.db.commit()
        return created

    def decide_ai_proposal(
        self,
        proposal_id_str: str,
        decision: str,  # APPROVE | REJECT | MODIFY
        human_value: Optional[str] = None,
        notes: Optional[str] = None,
        reviewer_id: str = "qa_reviewer",
        reviewer_role: str = "QUALITY_REVIEWER"
    ) -> Tuple[AIProposal, Complaint]:
        """Process human reviewer decision on an AI proposal with concurrency control and RBAC"""
        from backend.app.repositories.proposal_repository import AIProposalRepository
        from backend.app.core.rbac import AuthorizationService, Permission
        from fastapi import HTTPException, status

        # 1. Enforce RBAC permission
        AuthorizationService.enforce(reviewer_role, Permission.REVIEW_AI_PROPOSAL, reviewer_id)
        if decision.upper() == "MODIFY":
            # If changing severity or priority, check specific permissions
            repo = AIProposalRepository(self.db)
            prop_check = repo.get_by_code(proposal_id_str)
            if prop_check:
                if prop_check.field_name == "severity":
                    AuthorizationService.enforce(reviewer_role, Permission.CHANGE_SEVERITY, reviewer_id)
                elif prop_check.field_name == "priority":
                    AuthorizationService.enforce(reviewer_role, Permission.CHANGE_PRIORITY, reviewer_id)

        repo = AIProposalRepository(self.db)
        # 2. Concurrency Control: Load with row-level lock (SELECT FOR UPDATE)
        proposal = repo.get_by_code_for_update(proposal_id_str)
        if not proposal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "PROPOSAL_NOT_FOUND", "message": f"AI Proposal '{proposal_id_str}' not found."}}
            )

        # 3. Double-approval / Concurrency Conflict check
        if proposal.status not in ["PROPOSED", "AI_PROPOSED"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "PROPOSAL_ALREADY_REVIEWED",
                        "message": f"Proposal '{proposal_id_str}' has already been reviewed (Current status: {proposal.status}).",
                        "status": proposal.status,
                        "reviewed_by": proposal.reviewed_by,
                        "reviewed_at": proposal.reviewed_at.isoformat() if proposal.reviewed_at else None
                    }
                }
            )

        complaint = self.complaint_repo.get_by_id(proposal.complaint_id)
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "COMPLAINT_NOT_FOUND", "message": f"Associated complaint {proposal.complaint_id} not found."}}
            )

        # 4. Check if complaint is already closed
        if complaint.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "COMPLAINT_CLOSED", "message": "Cannot review or apply proposals to a closed complaint."}}
            )

        dec_upper = decision.strip().upper()
        field_name = proposal.field_name
        current_val = getattr(complaint, field_name, None)

        try:
            if dec_upper == "APPROVE":
                final_val = proposal.proposed_value
                if hasattr(complaint, field_name):
                    setattr(complaint, field_name, final_val)
                    self.complaint_repo.update(complaint)

                repo.update_decision(
                    proposal=proposal,
                    status="APPLIED",
                    reviewer_decision=final_val,
                    reviewer_notes=notes or "Approved by Quality Reviewer",
                    reviewed_by=reviewer_id
                )

                # Log immutable audit events
                self.event_repo.log_event(
                    complaint_id=complaint.id,
                    event_type="USER_APPROVED",
                    input_text=f"Reviewer approved AI proposal {proposal.proposal_id}: {field_name} → {final_val}",
                    structured_changes={"proposal_id": proposal.proposal_id, "field": field_name, "approved_value": final_val, "notes": notes},
                    diffs={field_name: {"before": current_val, "after": final_val}},
                    ai_run_id=proposal.ai_run_id,
                    actor=reviewer_id,
                    actor_type="USER"
                )
                self.event_repo.log_event(
                    complaint_id=complaint.id,
                    event_type="CHANGE_APPLIED",
                    input_text=f"Applied approved change to {field_name}",
                    structured_changes={"field": field_name, "applied_value": final_val},
                    diffs={field_name: {"before": current_val, "after": final_val}},
                    ai_run_id=proposal.ai_run_id,
                    actor=reviewer_id,
                    actor_type="USER"
                )

            elif dec_upper == "REJECT":
                rejection_reason = notes or "Reviewer determined evidence does not justify proposed change"
                repo.update_decision(
                    proposal=proposal,
                    status="REJECTED",
                    reviewer_decision="REJECTED",
                    reviewer_notes=rejection_reason,
                    rejection_reason=rejection_reason,
                    reviewed_by=reviewer_id
                )

                self.event_repo.log_event(
                    complaint_id=complaint.id,
                    event_type="USER_REJECTED",
                    input_text=f"Reviewer rejected AI proposal {proposal.proposal_id}. Reason: {rejection_reason}",
                    structured_changes={"proposal_id": proposal.proposal_id, "field": field_name, "rejection_reason": rejection_reason},
                    diffs={field_name: {"before": current_val, "retained": current_val, "rejected_proposal": proposal.proposed_value}},
                    ai_run_id=proposal.ai_run_id,
                    actor=reviewer_id,
                    actor_type="USER"
                )

            elif dec_upper == "MODIFY":
                final_val = human_value or proposal.proposed_value
                if hasattr(complaint, field_name):
                    setattr(complaint, field_name, final_val)
                    self.complaint_repo.update(complaint)

                mod_notes = notes or f"Reviewer modified AI proposal from '{proposal.proposed_value}' to '{final_val}'"
                repo.update_decision(
                    proposal=proposal,
                    status="MODIFIED",
                    reviewer_decision=final_val,
                    reviewer_notes=mod_notes,
                    reviewed_by=reviewer_id
                )

                # Log events: HUMAN_OVERRIDE & CHANGE_APPLIED
                self.event_repo.log_event(
                    complaint_id=complaint.id,
                    event_type="HUMAN_OVERRIDE",
                    input_text=f"Reviewer overrode AI proposal {proposal.proposal_id}: AI proposed '{proposal.proposed_value}' → Reviewer set '{final_val}'. Notes: {mod_notes}",
                    structured_changes={
                        "proposal_id": proposal.proposal_id,
                        "field": field_name,
                        "ai_recommendation": proposal.proposed_value,
                        "human_decision": final_val,
                        "final_value": final_val,
                        "notes": mod_notes
                    },
                    diffs={
                        field_name: {
                            "before": current_val,
                            "ai_proposed": proposal.proposed_value,
                            "human_override": final_val,
                            "final": final_val
                        }
                    },
                    ai_run_id=proposal.ai_run_id,
                    actor=reviewer_id,
                    actor_type="USER"
                )
                self.event_repo.log_event(
                    complaint_id=complaint.id,
                    event_type="CHANGE_APPLIED",
                    input_text=f"Applied human override change to {field_name}",
                    structured_changes={"field": field_name, "applied_value": final_val},
                    diffs={field_name: {"before": current_val, "after": final_val}},
                    ai_run_id=proposal.ai_run_id,
                    actor=reviewer_id,
                    actor_type="USER"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error": {"code": "INVALID_DECISION", "message": f"Unsupported decision '{decision}'. Must be APPROVE, REJECT, or MODIFY."}}
                )

            self.db.commit()
            self.db.refresh(complaint)
            self.db.refresh(proposal)
            return proposal, complaint

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Transaction failed in decide_ai_proposal: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": {"code": "TRANSACTION_FAILURE", "message": f"Failed to apply review decision atomically: {str(e)}"}}
            )

    def get_audit_timeline(self, complaint_id: int) -> Dict[str, Any]:
        """Generate structured chronological audit timeline for visual rendering"""
        complaint = self.complaint_repo.get_by_id(complaint_id)
        if not complaint:
            raise ValueError(f"Complaint {complaint_id} not found")

        events = self.event_repo.get_by_complaint(complaint_id)
        formatted_events = []

        for e in events:
            time_str = e.created_at.strftime("%H:%M") if e.created_at else "00:00"
            date_str = e.created_at.strftime("%d %B %Y %H:%M:%S UTC") if e.created_at else ""

            # Determine human-friendly event title
            title_map = {
                "COMPLAINT_CREATED": "Complaint Received",
                "COMPLAINT_UPDATED": "Complaint Updated",
                "AI_EXTRACTION_COMPLETED": "AI Extraction Completed",
                "DOCUMENT_EXTRACTED": "Document Upload & Extraction",
                "RISK_RECALCULATED": "Risk Assessment Generated",
                "AI_PROPOSAL_CREATED": "AI Proposed Change",
                "USER_APPROVED": "Quality Reviewer Approved",
                "USER_REJECTED": "Quality Reviewer Rejected",
                "USER_MODIFIED": "Quality Reviewer Override",
                "CHANGE_APPLIED": "Change Applied to Complaint",
                "STATE_TRANSITION": "QMS State Transition",
                "COMPLETENESS_CHECK": "Completeness Evaluated"
            }
            title = title_map.get(e.event_type, e.event_type.replace("_", " ").title())

            formatted_events.append({
                "id": e.id,
                "timestamp": date_str,
                "time_str": time_str,
                "event_type": e.event_type,
                "title": title,
                "description": e.input_text or title,
                "actor": e.actor,
                "actor_type": e.actor_type,
                "ai_run_id": e.ai_run_id,
                "diffs": e.diffs or {}
            })

        # Order chronologically (oldest first for timeline)
        formatted_events.sort(key=lambda x: x["id"] if x["id"] else 0)

        return {
            "complaint_number": complaint.complaint_number,
            "current_status": complaint.status,
            "events": formatted_events
        }

    def _create_new_entity(self, payload: Dict[str, Any], year: int) -> Complaint:
        complaint_num = payload.get("complaint_number") or self.complaint_repo.get_next_sequence_number(year)
        complaint = Complaint(
            complaint_number=complaint_num,
            complaint_source=payload.get("complaint_source") or "Customer Direct / Email",
            customer_name=payload.get("customer_name"),
            product_name=payload.get("product_name"),
            product_strength=payload.get("product_strength"),
            batch_number=payload.get("batch_number"),
            manufacturing_date=payload.get("manufacturing_date"),
            expiry_date=payload.get("expiry_date"),
            quantity_affected=str(payload.get("quantity_affected")) if payload.get("quantity_affected") is not None else None,
            quantity_unit=payload.get("quantity_unit") or "kg",
            complaint_type=payload.get("complaint_type") or "Foreign Matter / Contamination",
            complaint_date=payload.get("complaint_date") or datetime.datetime.now(datetime.UTC).strftime("%d %B %Y"),
            detailed_description=payload.get("detailed_description"),
            severity=payload.get("severity") or "Medium",
            priority=payload.get("priority") or "Normal",
            ai_confidence=payload.get("ai_confidence", 0.92),
            ai_reasoning=payload.get("ai_reasoning"),
            recommended_actions=payload.get("recommended_actions") or [],
            completeness_score=payload.get("completeness_score", 0.0),
            field_confidence=payload.get("field_confidence") or {},
            field_provenance=payload.get("field_provenance") or {},
            status=payload.get("status") or "Pending Triage"
        )
        return self.complaint_repo.create(complaint)


# Legacy functional helpers for backward compatibility
def create_or_save_complaint(data: Dict[str, Any], db: Session) -> Tuple[Complaint, bool]:
    service = ComplaintService(db)
    return service.save_or_create_complaint(data)

def list_all_complaints(db: Session) -> List[Complaint]:
    service = ComplaintService(db)
    items, _ = service.list_complaints(page=1, page_size=100)
    return items

def get_complaint_by_id(complaint_id: int, db: Session) -> Optional[Complaint]:
    service = ComplaintService(db)
    return service.get_complaint(complaint_id)
