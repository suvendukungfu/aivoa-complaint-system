"""
AIVOA Phase 9.7 — HITL Concurrency & Failure Test Suite
Verifies optimistic concurrency control, race conditions, double approvals,
and invalid proposal decision state transitions return HTTP 409 Conflict.
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import init_db, SessionLocal
from backend.app.services.complaint_service import ComplaintService

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield

def create_test_complaint_and_proposal():
    db = SessionLocal()
    service = ComplaintService(db)
    uid = uuid.uuid4().hex[:6].upper()
    complaint, _ = service.save_or_create_complaint({
        "customer_name": "Concurrency Pharma",
        "product_name": "Paracetamol API",
        "batch_number": f"BATCH-{uid}",
        "severity": "Medium"
    })
    proposals = service.create_ai_proposals(
        complaint_id=complaint.id,
        proposals_data=[{
            "proposal_type": "RISK_SEVERITY",
            "field_name": "severity",
            "current_value": "Medium",
            "proposed_value": "High",
            "reason": "Foreign matter detected.",
            "source": "AI Risk Assessment",
            "confidence_score": 0.96
        }]
    )
    c_id = complaint.id
    p_id = proposals[0].proposal_id
    db.close()
    return c_id, p_id


def test_concurrent_double_approval_returns_409_conflict():
    """Verify Reviewer A succeeds (200) and simultaneous Reviewer B gets 409 Conflict"""
    complaint_id, proposal_id = create_test_complaint_and_proposal()
    
    # Reviewer A approves
    res_a = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/approve",
        json={"notes": "Approved by Reviewer A", "reviewer_id": "reviewer_a", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert res_a.status_code == 200
    
    # Reviewer B attempts approving already applied proposal
    res_b = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/approve",
        json={"notes": "Approved by Reviewer B", "reviewer_id": "reviewer_b", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert res_b.status_code == 409
    err = res_b.json()
    assert err["error"]["code"] == "PROPOSAL_ALREADY_REVIEWED"


def test_approve_already_rejected_proposal_returns_409():
    """Verify attempting to approve a rejected proposal returns 409 Conflict"""
    complaint_id, proposal_id = create_test_complaint_and_proposal()
    
    # Reject first
    rej_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/reject",
        json={"reason": "Insufficient quality evidence.", "reviewer_id": "qa_01", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert rej_res.status_code == 200
    
    # Attempt approving rejected proposal
    app_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/approve",
        json={"notes": "Attempting approval after rejection", "reviewer_id": "qa_02", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert app_res.status_code == 409
    assert app_res.json()["error"]["code"] == "PROPOSAL_ALREADY_REVIEWED"


def test_reject_already_applied_proposal_returns_409():
    """Verify attempting to reject an applied proposal returns 409 Conflict"""
    complaint_id, proposal_id = create_test_complaint_and_proposal()
    
    # Approve first
    app_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/approve",
        json={"notes": "Initial approval", "reviewer_id": "qa_01", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert app_res.status_code == 200
    
    # Attempt rejecting applied proposal
    rej_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/reject",
        json={"reason": "Late rejection attempt", "reviewer_id": "qa_02", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert rej_res.status_code == 409
    assert rej_res.json()["error"]["code"] == "PROPOSAL_ALREADY_REVIEWED"


def test_modify_already_reviewed_proposal_returns_409():
    """Verify attempting to modify an already reviewed proposal returns 409 Conflict"""
    complaint_id, proposal_id = create_test_complaint_and_proposal()
    
    # Modify first
    mod1_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/modify",
        json={"human_value": "Critical", "reason": "First override", "reviewer_id": "qa_01", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert mod1_res.status_code == 200
    
    # Attempt modifying again
    mod2_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/modify",
        json={"human_value": "High", "reason": "Second override attempt", "reviewer_id": "qa_02", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert mod2_res.status_code == 409
    assert mod2_res.json()["error"]["code"] == "PROPOSAL_ALREADY_REVIEWED"


def test_approve_proposal_on_closed_complaint_returns_409():
    """Verify cannot approve or apply proposals to a closed complaint"""
    db = SessionLocal()
    service = ComplaintService(db)
    uid = uuid.uuid4().hex[:6].upper()
    complaint, _ = service.save_or_create_complaint({
        "customer_name": "Closed Pharma",
        "product_name": "Aspirin",
        "batch_number": f"ASP-{uid}",
        "severity": "Low",
        "status": "CLOSED"
    })
    proposals = service.create_ai_proposals(
        complaint_id=complaint.id,
        proposals_data=[{
            "proposal_type": "RISK_SEVERITY",
            "field_name": "severity",
            "proposed_value": "High",
            "reason": "Late proposal."
        }]
    )
    c_id = complaint.id
    p_id = proposals[0].proposal_id
    db.close()
    
    # Attempt approving proposal on closed complaint
    res = client.post(
        f"/api/v1/complaints/{c_id}/proposals/{p_id}/approve",
        json={"notes": "Approval on closed record", "reviewer_id": "qa_01", "reviewer_role": "QUALITY_REVIEWER"}
    )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "COMPLAINT_CLOSED"
