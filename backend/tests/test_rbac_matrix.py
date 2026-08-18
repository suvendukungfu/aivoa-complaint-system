"""
AIVOA Phase 9.8 — RBAC Permission Matrix Test Suite
Verifies backend authorization enforcement across all 4 roles:
- COMPLAINT_OPERATOR
- QUALITY_REVIEWER
- QUALITY_MANAGER
- ADMIN
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import init_db, SessionLocal
from backend.app.models.complaint import Complaint, AIProposal
from backend.app.services.complaint_service import ComplaintService
from backend.app.core.rbac import AuthorizationService, Role, Permission

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield

def create_sample_complaint_and_proposal():
    db = SessionLocal()
    service = ComplaintService(db)
    uid = uuid.uuid4().hex[:6].upper()
    complaint, _ = service.save_or_create_complaint({
        "customer_name": "RBAC Test Pharma",
        "product_name": "Amoxicillin Trihydrate",
        "batch_number": f"AMX-{uid}",
        "severity": "Medium"
    })
    proposals = service.create_ai_proposals(
        complaint_id=complaint.id,
        proposals_data=[{
            "proposal_type": "RISK_SEVERITY",
            "field_name": "severity",
            "current_value": "Medium",
            "proposed_value": "High",
            "reason": "Container seal compromised.",
            "source": "AI Risk Assessment",
            "confidence_score": 0.95
        }]
    )
    c_id = complaint.id
    p_id = proposals[0].proposal_id
    db.close()
    return c_id, p_id


# --- 1. COMPLAINT OPERATOR TESTS ---

def test_operator_can_create_and_edit_complaints():
    """COMPLAINT_OPERATOR has permissions to create and edit complaint intake"""
    complaint_id, _ = create_sample_complaint_and_proposal()
    assert AuthorizationService.has_permission(Role.COMPLAINT_OPERATOR, Permission.CREATE_COMPLAINT)
    assert AuthorizationService.has_permission(Role.COMPLAINT_OPERATOR, Permission.EDIT_COMPLAINT)


def test_operator_cannot_review_proposals():
    """COMPLAINT_OPERATOR is forbidden from approving AI proposals (HTTP 403)"""
    complaint_id, proposal_id = create_sample_complaint_and_proposal()
    res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/approve",
        json={"notes": "Operator approval attempt", "reviewer_id": "op_01", "reviewer_role": "COMPLAINT_OPERATOR"}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "UNAUTHORIZED_OPERATION"


def test_operator_cannot_close_complaint():
    """COMPLAINT_OPERATOR is forbidden from closing complaints (HTTP 403)"""
    complaint_id, _ = create_sample_complaint_and_proposal()
    res = client.post(
        f"/api/v1/complaints/{complaint_id}/transition",
        json={"target_state": "CLOSED", "reason": "Operator closing", "actor_id": "op_01", "actor_role": "COMPLAINT_OPERATOR"}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "UNAUTHORIZED_OPERATION"


# --- 2. QUALITY REVIEWER TESTS ---

def test_reviewer_can_review_proposals_and_modify_severity():
    """QUALITY_REVIEWER can approve proposals, modify severity, and triage complaints"""
    complaint_id, proposal_id = create_sample_complaint_and_proposal()
    res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/modify",
        json={"human_value": "Critical", "reason": "QA review override", "reviewer_id": "qa_rev_01", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert res.status_code == 200
    assert res.json()["proposal"]["status"] == "MODIFIED"


def test_reviewer_cannot_close_complaint():
    """QUALITY_REVIEWER is forbidden from final closing of complaints (Requires QUALITY_MANAGER / QP)"""
    complaint_id, _ = create_sample_complaint_and_proposal()
    # Advance to QUALITY_DECISION
    db = SessionLocal()
    service = ComplaintService(db)
    service.transition_complaint_state(complaint_id, "UNDER_REVIEW", actor="qa_rev_01", actor_role="QUALITY_REVIEWER")
    service.transition_complaint_state(complaint_id, "INVESTIGATION", actor="qa_rev_01", actor_role="QUALITY_REVIEWER")
    service.transition_complaint_state(complaint_id, "QUALITY_DECISION", actor="qa_rev_01", actor_role="QUALITY_REVIEWER")
    db.close()

    res = client.post(
        f"/api/v1/complaints/{complaint_id}/transition",
        json={"target_state": "CLOSED", "reason": "Reviewer closing attempt", "actor_id": "qa_rev_01", "actor_role": "QUALITY_REVIEWER"}
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "UNAUTHORIZED_OPERATION"


# --- 3. QUALITY MANAGER & ADMIN TESTS ---

def test_manager_can_close_complaints():
    """QUALITY_MANAGER has authority to close complaints following investigation"""
    db = SessionLocal()
    service = ComplaintService(db)
    uid = uuid.uuid4().hex[:6].upper()
    complaint, _ = service.save_or_create_complaint({
        "customer_name": "Manager Pharma",
        "product_name": "Paracetamol",
        "batch_number": f"PARA-{uid}",
        "severity": "Low"
    })
    # Advance through state machine: PENDING_TRIAGE -> UNDER_REVIEW -> INVESTIGATION -> QUALITY_DECISION
    service.transition_complaint_state(complaint.id, "UNDER_REVIEW", actor="mgr_01", actor_role="QUALITY_MANAGER")
    service.transition_complaint_state(complaint.id, "INVESTIGATION", actor="mgr_01", actor_role="QUALITY_MANAGER")
    service.transition_complaint_state(complaint.id, "QUALITY_DECISION", actor="mgr_01", actor_role="QUALITY_MANAGER")
    c_id = complaint.id
    db.close()
    
    res = client.post(
        f"/api/v1/complaints/{c_id}/transition",
        json={"target_state": "CLOSED", "reason": "Investigation complete and CAPA verified.", "actor_id": "mgr_01", "actor_role": "QUALITY_MANAGER"}
    )
    assert res.status_code == 200
    assert res.json()["new_state"] == "CLOSED"


def test_admin_has_full_permissions():
    """ADMIN role possesses all GxP operational permissions"""
    assert AuthorizationService.has_permission(Role.ADMIN, Permission.CREATE_COMPLAINT)
    assert AuthorizationService.has_permission(Role.ADMIN, Permission.REVIEW_AI_PROPOSAL)
    assert AuthorizationService.has_permission(Role.ADMIN, Permission.CLOSE_COMPLAINT)
    assert AuthorizationService.has_permission(Role.ADMIN, Permission.VIEW_AUDIT)
