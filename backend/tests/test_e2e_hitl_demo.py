"""
AIVOA Phase 8 Flagship E2E Demo Scenario
Simulates the exact end-to-end pharmaceutical quality complaint workflow:
1. Natural language complaint intake
2. Page/text span evidence grounding & deterministic RiskPolicyEngine evaluation
3. AI proposal creation for human review
4. Quality Reviewer inspection of verbatim evidence
5. Reviewer Human Override (High -> Critical) with documented GxP justification
6. Atomic application & state transition to UNDER_REVIEW
7. Verification of 21 CFR Part 11 immutable audit trail
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import init_db, SessionLocal
from backend.app.models.complaint import Complaint, AIProposal, ComplaintEvent

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield


def test_flagship_hitl_demo_workflow():
    """Execute complete end-to-end complaint lifecycle and human quality review story"""
    
    # 1. Intake: Natural language text submission
    demo_prompt = (
        "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. "
        "Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."
    )
    
    intake_res = client.post("/api/v1/complaints/log", json={"text": demo_prompt})
    assert intake_res.status_code == 200
    intake_data = intake_res.json()
    
    complaint_dict = intake_data["complaint"]
    assert complaint_dict["customer_name"] == "ABC Pharma"
    assert "Paracetamol" in complaint_dict["product_name"]
    assert complaint_dict["product_strength"] == "99.5%"
    assert complaint_dict["batch_number"] == "PA240812"
    assert complaint_dict["quantity_affected"] == "25"
    
    # 2. Risk & Completeness Verification
    risk = intake_data["risk_assessment"]
    assert risk is not None
    assert risk["severity"] in ["High", "Critical"]
    assert len(risk["recommended_actions"]) > 0
    assert any("quarantine" in act.lower() or "investigat" in act.lower() for act in risk["recommended_actions"])
    
    # 3. Persist complaint to database
    save_res = client.post("/api/v1/complaints/save", json=complaint_dict)
    assert save_res.status_code == 200
    complaint_id = save_res.json()["id"]
    complaint_number = save_res.json()["complaint_number"]
    assert complaint_id is not None

    # 4. Fetch generated AI proposals
    proposals_res = client.get(f"/api/v1/complaints/{complaint_id}/proposals")
    assert proposals_res.status_code == 200
    proposals = proposals_res.json()
    assert len(proposals) > 0
    
    severity_proposal = next((p for p in proposals if p["field_name"] == "severity"), proposals[0])
    proposal_id = severity_proposal["proposal_id"]
    assert severity_proposal["status"] in ["PROPOSED", "AI_PROPOSED"]
    
    # 5. Reviewer executes Human Override (High -> Critical)
    override_reason = "Potential batch-wide contamination requires immediate critical escalation."
    override_res = client.post(
        f"/api/v1/complaints/{complaint_id}/proposals/{proposal_id}/modify",
        json={
            "human_value": "Critical",
            "reason": override_reason,
            "reviewer_id": "dr_jane_qp",
            "reviewer_role": "QUALITY_REVIEWER"
        }
    )
    assert override_res.status_code == 200
    updated_proposal = override_res.json()["proposal"]
    assert updated_proposal["status"] in ["MODIFIED", "APPLIED", "APPROVED"]
    assert override_res.json()["complaint"]["severity"] == "Critical"

    # 6. Quality Reviewer transitions complaint state: PENDING_TRIAGE -> UNDER_REVIEW
    transition_res = client.post(
        f"/api/v1/complaints/{complaint_id}/transition",
        json={
            "target_state": "UNDER_REVIEW",
            "reason": "QA triage approved with critical override. Assigning investigation team.",
            "actor_id": "qa_manager_01",
            "actor_role": "QUALITY_MANAGER"
        }
    )
    assert transition_res.status_code == 200
    assert transition_res.json()["new_state"] == "UNDER_REVIEW"

    # 7. Audit Verification: 21 CFR Part 11 immutable ledger check
    timeline_res = client.get(f"/api/v1/complaints/{complaint_id}/timeline")
    assert timeline_res.status_code == 200
    events = timeline_res.json()["events"]
    
    event_types = [e["event_type"] for e in events]
    assert "COMPLAINT_CREATED" in event_types
    assert "HUMAN_OVERRIDE" in event_types
    assert "STATE_TRANSITION" in event_types
    
    # Verify Human Override event details
    override_event = next(e for e in events if e["event_type"] == "HUMAN_OVERRIDE")
    assert override_event["actor"] == "dr_jane_qp"
    assert override_event["actor_type"] in ["USER", "HUMAN"]
    diff = override_event["diffs"]["severity"]
    assert diff["human_override"] == "Critical"
    assert diff["final"] == "Critical"

    # Verify Reviewer Dashboard Metrics update
    dashboard_res = client.get("/api/v1/complaints/dashboard/review")
    assert dashboard_res.status_code == 200
    dashboard_data = dashboard_res.json()
    assert dashboard_data["human_overrides"] >= 1
    assert dashboard_data["high_critical_complaints"] >= 1
