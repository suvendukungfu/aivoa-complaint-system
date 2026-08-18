"""
AIVOA Phase 6 — Complaint Lifecycle State Machine
Enforces strict lifecycle state transitions inspired by 21 CFR Part 11 & GxP quality principles for customer complaint records.
"""

import enum
import logging
from typing import Dict, Any, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

class ComplaintStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_TRIAGE = "PENDING_TRIAGE"
    UNDER_REVIEW = "UNDER_REVIEW"
    INVESTIGATION = "INVESTIGATION"
    QUALITY_DECISION = "QUALITY_DECISION"
    CLOSED = "CLOSED"

# Normalized mappings for backward compatibility
STATUS_ALIAS_MAP: Dict[str, ComplaintStatus] = {
    "draft": ComplaintStatus.DRAFT,
    "submitted": ComplaintStatus.SUBMITTED,
    "pending triage": ComplaintStatus.PENDING_TRIAGE,
    "pending_triage": ComplaintStatus.PENDING_TRIAGE,
    "under review": ComplaintStatus.UNDER_REVIEW,
    "under_review": ComplaintStatus.UNDER_REVIEW,
    "under investigation": ComplaintStatus.INVESTIGATION,
    "under_investigation": ComplaintStatus.INVESTIGATION,
    "investigation": ComplaintStatus.INVESTIGATION,
    "escalated to capa": ComplaintStatus.INVESTIGATION,
    "quality decision": ComplaintStatus.QUALITY_DECISION,
    "quality_decision": ComplaintStatus.QUALITY_DECISION,
    "closed": ComplaintStatus.CLOSED,
}

class InvalidStateTransitionError(ValueError):
    """Raised when an illegal lifecycle state transition is attempted"""
    pass

class ComplaintStateMachine:
    """Deterministic QMS Complaint Lifecycle State Machine enforcing GxP transition rules"""

    # Explicit allowed transitions matrix
    ALLOWED_TRANSITIONS: Dict[ComplaintStatus, Set[ComplaintStatus]] = {
        ComplaintStatus.DRAFT: {
            ComplaintStatus.SUBMITTED,
            ComplaintStatus.PENDING_TRIAGE
        },
        ComplaintStatus.SUBMITTED: {
            ComplaintStatus.PENDING_TRIAGE,
            ComplaintStatus.UNDER_REVIEW,
            ComplaintStatus.DRAFT
        },
        ComplaintStatus.PENDING_TRIAGE: {
            ComplaintStatus.UNDER_REVIEW,
            ComplaintStatus.INVESTIGATION,
            ComplaintStatus.DRAFT
        },
        ComplaintStatus.UNDER_REVIEW: {
            ComplaintStatus.INVESTIGATION,
            ComplaintStatus.QUALITY_DECISION,
            ComplaintStatus.CLOSED
        },
        ComplaintStatus.INVESTIGATION: {
            ComplaintStatus.QUALITY_DECISION,
            ComplaintStatus.UNDER_REVIEW
        },
        ComplaintStatus.QUALITY_DECISION: {
            ComplaintStatus.CLOSED,
            ComplaintStatus.INVESTIGATION,
            ComplaintStatus.UNDER_REVIEW
        },
        ComplaintStatus.CLOSED: {
            ComplaintStatus.UNDER_REVIEW  # Formal CAPA re-opening
        }
    }

    STATE_METADATA: Dict[ComplaintStatus, Dict[str, Any]] = {
        ComplaintStatus.DRAFT: {
            "label": "Draft",
            "description": "Initial intake in progress. Incomplete information acceptable.",
            "color": "#64748b",
            "bg": "#f1f5f9",
            "requires_human_approval": False
        },
        ComplaintStatus.SUBMITTED: {
            "label": "Submitted",
            "description": "Formally submitted for QMS triage and intake review.",
            "color": "#0284c7",
            "bg": "#e0f2fe",
            "requires_human_approval": False
        },
        ComplaintStatus.PENDING_TRIAGE: {
            "label": "Pending Triage",
            "description": "AI extraction and preliminary risk scoring generated. Awaiting QA review.",
            "color": "#d97706",
            "bg": "#fef3c7",
            "requires_human_approval": False
        },
        ComplaintStatus.UNDER_REVIEW: {
            "label": "Under Review",
            "description": "Quality assurance reviewer evaluating AI recommendations and evidence.",
            "color": "#7c3aed",
            "bg": "#ede9fe",
            "requires_human_approval": True
        },
        ComplaintStatus.INVESTIGATION: {
            "label": "Investigation",
            "description": "Formal Level-2 Quality Investigation / Root Cause Analysis initiated.",
            "color": "#dc2626",
            "bg": "#fee2e2",
            "requires_human_approval": True
        },
        ComplaintStatus.QUALITY_DECISION: {
            "label": "Quality Decision",
            "description": "Qualified Person (QP) / QA manager formulating final product disposition.",
            "color": "#ea580c",
            "bg": "#ffedd5",
            "requires_human_approval": True
        },
        ComplaintStatus.CLOSED: {
            "label": "Closed",
            "description": "Complaint investigation resolved, CAPA documented, and record finalized.",
            "color": "#16a34a",
            "bg": "#dcfce7",
            "requires_human_approval": True
        }
    }

    @classmethod
    def normalize_status(cls, status_str: Optional[str]) -> ComplaintStatus:
        """Convert arbitrary string into normalized ComplaintStatus enum"""
        if not status_str:
            return ComplaintStatus.PENDING_TRIAGE
        
        normalized = status_str.strip().lower()
        if normalized in STATUS_ALIAS_MAP:
            return STATUS_ALIAS_MAP[normalized]
        
        try:
            return ComplaintStatus(status_str.upper())
        except ValueError:
            logger.warning(f"Unknown complaint status '{status_str}', defaulting to PENDING_TRIAGE")
            return ComplaintStatus.PENDING_TRIAGE

    @classmethod
    def can_transition(cls, current_status: str, target_status: str) -> bool:
        """Check if transition from current_status to target_status is valid"""
        curr = cls.normalize_status(current_status)
        target = cls.normalize_status(target_status)
        
        if curr == target:
            return True
            
        allowed = cls.ALLOWED_TRANSITIONS.get(curr, set())
        return target in allowed

    @classmethod
    def validate_transition(
        cls,
        current_status: str,
        target_status: str,
        actor_type: str = "HUMAN"
    ) -> Tuple[ComplaintStatus, ComplaintStatus]:
        """
        Validate transition and raise InvalidStateTransitionError if illegal.
        Returns (current_enum, target_enum).
        """
        curr = cls.normalize_status(current_status)
        target = cls.normalize_status(target_status)

        if curr == target:
            return curr, target

        allowed = cls.ALLOWED_TRANSITIONS.get(curr, set())
        if target not in allowed:
            allowed_names = [a.value for a in allowed]
            raise InvalidStateTransitionError(
                f"Illegal QMS lifecycle state transition from '{curr.value}' to '{target.value}'. "
                f"Permitted next states from '{curr.value}': {allowed_names}"
            )

        # AI actors cannot directly transition to INVESTIGATION, QUALITY_DECISION, or CLOSED
        if actor_type == "AI" and target in {ComplaintStatus.INVESTIGATION, ComplaintStatus.QUALITY_DECISION, ComplaintStatus.CLOSED}:
            raise InvalidStateTransitionError(
                f"AI copilot is not authorized to transition complaints directly to '{target.value}'. "
                f"Mandatory human Quality review required."
            )

        return curr, target

    @classmethod
    def get_allowed_transitions(cls, current_status: str) -> List[Dict[str, Any]]:
        """Return list of allowed next states with rich UI metadata"""
        curr = cls.normalize_status(current_status)
        allowed = cls.ALLOWED_TRANSITIONS.get(curr, set())
        
        result = []
        for state in allowed:
            meta = cls.STATE_METADATA.get(state, {})
            result.append({
                "status": state.value,
                "label": meta.get("label", state.value),
                "description": meta.get("description", ""),
                "color": meta.get("color", "#64748b"),
                "bg": meta.get("bg", "#f1f5f9")
            })
        return result

    @classmethod
    def get_status_info(cls, status_str: str) -> Dict[str, Any]:
        """Return rich metadata for given status"""
        state = cls.normalize_status(status_str)
        meta = cls.STATE_METADATA.get(state, {})
        return {
            "status": state.value,
            "label": meta.get("label", state.value),
            "description": meta.get("description", ""),
            "color": meta.get("color", "#64748b"),
            "bg": meta.get("bg", "#f1f5f9"),
            "requires_human_approval": meta.get("requires_human_approval", False)
        }
