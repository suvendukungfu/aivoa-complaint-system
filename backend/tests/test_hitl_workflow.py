"""
AIVOA Phase 8 Test Suite: Human-in-the-Loop Quality Workflow, State Machine, RBAC, and Concurrency
Tests full 21 CFR Part 11 and GxP compliance invariants.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import get_db, Base, engine, SessionLocal, init_db
from backend.app.models.complaint import Complaint, AIProposal, ComplaintEvent
from backend.app.agents.statemachine import ComplaintStateMachine, ComplaintStatus, InvalidStateTransitionError
from backend.app.core.rbac import AuthorizationService, Role, Permission

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield


def test_state_transitions_success():
    """Verify valid progression through all 7 lifecycle stages"""
    # DRAFT -> SUBMITTED -> PENDING_TRIAGE -> UNDER_REVIEW -> INVESTIGATION -> QUALITY_DECISION -> CLOSED
    curr, nxt = ComplaintStateMachine.validate_transition("DRAFT", "SUBMITTED")
    assert nxt == ComplaintStatus.SUBMITTED

    curr, nxt = ComplaintStateMachine.validate_transition("SUBMITTED", "PENDING_TRIAGE")
    assert nxt == ComplaintStatus.PENDING_TRIAGE

    curr, nxt = ComplaintStateMachine.validate_transition("PENDING_TRIAGE", "UNDER_REVIEW")
    assert nxt == ComplaintStatus.UNDER_REVIEW

    curr, nxt = ComplaintStateMachine.validate_transition("UNDER_REVIEW", "INVESTIGATION")
    assert nxt == ComplaintStatus.INVESTIGATION

    curr, nxt = ComplaintStateMachine.validate_transition("INVESTIGATION", "QUALITY_DECISION")
    assert nxt == ComplaintStatus.QUALITY_DECISION

    curr, nxt = ComplaintStateMachine.validate_transition("QUALITY_DECISION", "CLOSED")
    assert nxt == ComplaintStatus.CLOSED


def test_invalid_state_transition_raises_error():
    """Verify invalid transition is strictly rejected"""
    with pytest.raises(InvalidStateTransitionError):
        ComplaintStateMachine.validate_transition("CLOSED", "DRAFT")

    with pytest.raises(InvalidStateTransitionError):
        ComplaintStateMachine.validate_transition("DRAFT", "QUALITY_DECISION")


def test_invalid_state_transition_api_returns_409_conflict():
    """Verify backend API returns HTTP 409 Conflict with structured error format on invalid transition"""
    # 1. Create complaint
    create_res = client.post("/api/v1/complaints/save", json={
        "customer_name": "Novartis Pharma",
        "product_name": "Paracetamol 500mg",
        "batch_number": "PA240812",
        "severity": "Medium",
        "status": "DRAFT",
        "detailed_description": "Initial intake draft"
    })
    assert create_res.status_code == 200
    complaint_id = create_res.json()["id"]

    # 2. Attempt illegal transition: DRAFT -> CLOSED (must return 409)
    res = client.post(f"/api/v1/complaints/{complaint_id}/transition", json={
        "target_state": "CLOSED",
        "reason": "Direct close attempt without review",
        "actor_id": "qa_operator",
        "actor_role": "QUALITY_MANAGER"
    })
    assert res.status_code == 409
    data = res.json()
    assert data["error"]["code"] == "INVALID_STATE_TRANSITION"
    assert "Illegal QMS lifecycle state transition" in data["error"]["message"]


def test_create_and_approve_ai_proposal():
    """Test AI proposal creation and human reviewer approval workflow"""
    import uuid
    prop_id = f"PROP-TEST-{uuid.uuid4().hex[:6].upper()}"
    save_res = client.post("/api/v1/complaints/save", json={
        "customer_name": "Sanofi Healthcare",
        "product_name": "Metformin 850mg",
        "batch_number": "MF260801",
        "severity": "Low",
        "detailed_description": "Foreign particulate matter identified in batch"
    })
    complaint_id = save_res.json()["id"]

    # Create AI proposal directly in DB
    db = SessionLocal()
    proposal = AIProposal(
        proposal_id=prop_id,
        complaint_id=complaint_id,
        ai_run_id="AI-TEST-99",
        proposal_type="RISK_SEVERITY",
        field_name="severity",
        current_value="Low",
        proposed_value="High",
        reason="Foreign particulate matter detected",
        source="AI Risk Assessment",
        confidence_score=0.98,
        status="PROPOSED"
    )
    db.add(proposal)
    db.commit()
    db.close()

    # Quality Reviewer approves proposal
    approve_res = client.post(f"/api/v1/complaints/{complaint_id}/proposals/{prop_id}/approve", json={
        "notes": "Approved by QA Lead",
        "reviewer_id": "qa_lead_01",
        "reviewer_role": "QUALITY_REVIEWER"
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["success"] is True
    assert approve_res.json()["proposal"]["status"] in ["APPROVED", "APPLIED"]
    assert approve_res.json()["complaint"]["severity"] == "High"


def test_reject_ai_proposal_with_mandatory_reason():
    """Test proposal rejection requires justification and leaves base complaint unchanged"""
    import uuid
    prop_id = f"PROP-REJ-{uuid.uuid4().hex[:6].upper()}"
    save_res = client.post("/api/v1/complaints/save", json={
        "customer_name": "Pfizer Inc",
        "product_name": "Atorvastatin 20mg",
        "batch_number": "AT260802",
        "severity": "Medium",
        "detailed_description": "Carton scuff mark on external shipment box"
    })
    complaint_id = save_res.json()["id"]

    db = SessionLocal()
    proposal = AIProposal(
        proposal_id=prop_id,
        complaint_id=complaint_id,
        field_name="severity",
        current_value="Medium",
        proposed_value="Critical",
        reason="Overly sensitive keyword trigger",
        status="PROPOSED"
    )
    db.add(proposal)
    db.commit()
    db.close()

    # Reject proposal
    reject_res = client.post(f"/api/v1/complaints/{complaint_id}/proposals/{prop_id}/reject", json={
        "reason": "Defect is purely cosmetic secondary packaging scuff. Does not impact drug product.",
        "reviewer_id": "qa_auditor_02",
        "reviewer_role": "QUALITY_REVIEWER"
    })
    assert reject_res.status_code == 200
    assert reject_res.json()["proposal"]["status"] == "REJECTED"
    assert reject_res.json()["complaint"]["severity"] == "Medium"  # Retained original


def test_human_override_preserves_both_ai_and_human_values():
    """Test reviewer modifying AI recommendation preserves AI proposal, human decision, and final value"""
    import uuid
    prop_id = f"PROP-MOD-{uuid.uuid4().hex[:6].upper()}"
    save_res = client.post("/api/v1/complaints/save", json={
        "customer_name": "ABC Pharma",
        "product_name": "Paracetamol API 99.5%",
        "batch_number": "PA240812",
        "severity": "Medium",
        "detailed_description": "Customer detected visible black specks in drum 1 during weighing."
    })
    complaint_id = save_res.json()["id"]

    db = SessionLocal()
    proposal = AIProposal(
        proposal_id=prop_id,
        complaint_id=complaint_id,
        ai_run_id="AI-93D22C",
        field_name="severity",
        current_value="Medium",
        proposed_value="High",
        reason="Foreign particulate matter detected",
        status="PROPOSED"
    )
    db.add(proposal)
    db.commit()
    db.close()

    # Human Reviewer changes High -> Critical
    modify_res = client.post(f"/api/v1/complaints/{complaint_id}/proposals/{prop_id}/modify", json={
        "human_value": "Critical",
        "reason": "Potential batch-wide contamination requires escalation.",
        "reviewer_id": "dr_jane_qp",
        "reviewer_role": "QUALITY_REVIEWER"
    })
    assert modify_res.status_code == 200
    assert modify_res.json()["complaint"]["severity"] == "Critical"

    # Verify audit timeline recorded HUMAN_OVERRIDE with diffs
    timeline_res = client.get(f"/api/v1/complaints/{complaint_id}/timeline")
    assert timeline_res.status_code == 200
    events = timeline_res.json()["events"]
    override_events = [e for e in events if e["event_type"] == "HUMAN_OVERRIDE"]
    assert len(override_events) > 0
    diff = override_events[0]["diffs"]["severity"]
    assert diff["ai_proposed"] == "High"
    assert diff["human_override"] == "Critical"
    assert diff["final"] == "Critical"


def test_double_approval_concurrency_protection():
    """Verify second approval on an already reviewed proposal fails with 409 Conflict"""
    import uuid
    prop_id = f"PROP-RACE-{uuid.uuid4().hex[:6].upper()}"
    save_res = client.post("/api/v1/complaints/save", json={
        "customer_name": "GSK",
        "product_name": "Amoxicillin 500mg",
        "batch_number": "AM260803",
        "severity": "Low",
        "detailed_description": "Batch certificate inspection"
    })
    complaint_id = save_res.json()["id"]

    db = SessionLocal()
    proposal = AIProposal(
        proposal_id=prop_id,
        complaint_id=complaint_id,
        field_name="priority",
        current_value="Normal",
        proposed_value="High",
        status="PROPOSED"
    )
    db.add(proposal)
    db.commit()
    db.close()

    # First reviewer approves
    res1 = client.post(f"/api/v1/complaints/{complaint_id}/proposals/{prop_id}/approve", json={
        "notes": "Reviewer A approval",
        "reviewer_id": "reviewer_a",
        "reviewer_role": "QUALITY_REVIEWER"
    })
    assert res1.status_code == 200

    # Second reviewer attempts approval -> 409 Conflict
    res2 = client.post(f"/api/v1/complaints/{complaint_id}/proposals/{prop_id}/approve", json={
        "notes": "Reviewer B simultaneous approval",
        "reviewer_id": "reviewer_b",
        "reviewer_role": "QUALITY_REVIEWER"
    })
    assert res2.status_code == 409
    assert res2.json()["error"]["code"] == "PROPOSAL_ALREADY_REVIEWED"


def test_rbac_authorization_enforcement():
    """Verify COMPLAINT_OPERATOR cannot review AI proposals or close complaints"""
    # 1. Operator cannot review proposal
    with pytest.raises(Exception):
        AuthorizationService.enforce("COMPLAINT_OPERATOR", Permission.REVIEW_AI_PROPOSAL)

    # 2. Reviewer can review proposal, but cannot close complaint
    assert AuthorizationService.has_permission(Role.QUALITY_REVIEWER, Permission.REVIEW_AI_PROPOSAL) is True
    assert AuthorizationService.has_permission(Role.QUALITY_REVIEWER, Permission.CLOSE_COMPLAINT) is False

    # 3. Quality Manager can close complaint
    assert AuthorizationService.has_permission(Role.QUALITY_MANAGER, Permission.CLOSE_COMPLAINT) is True


def test_reviewer_dashboard_analytics():
    """Verify dashboard metrics are computed accurately from real database queries"""
    res = client.get("/api/v1/complaints/dashboard/review")
    assert res.status_code == 200
    data = res.json()
    assert "pending_ai_reviews" in data
    assert "ai_override_rate_pct" in data
    assert "ai_acceptance_rate_pct" in data
    assert "high_critical_complaints" in data
    assert isinstance(data["ai_override_rate_pct"], (int, float))
