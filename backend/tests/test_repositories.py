import pytest
from backend.app.db.session import SessionLocal
from backend.app.models.complaint import Complaint
from backend.app.repositories.complaint_repository import ComplaintRepository
from backend.app.repositories.event_repository import ComplaintEventRepository

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_atomic_sequence_number_generation(db_session):
    repo = ComplaintRepository(db_session)
    seq = repo.get_next_sequence_number(2026)
    assert seq.startswith("CMP-2026-")
    assert len(seq) == 13

def test_repository_paginated_list_and_search(db_session):
    repo = ComplaintRepository(db_session)
    # Create test complaint
    test_cmp = Complaint(
        complaint_number="CMP-TEST-REP-01",
        customer_name="Repo Test Pharma",
        product_name="Amoxicillin Trihydrate",
        batch_number="REP-BATCH-99",
        detailed_description="Repository integration test",
        severity="High",
        status="Pending Triage"
    )
    repo.create(test_cmp)
    db_session.commit()

    # Search by product name
    items, total = repo.list_paginated(page=1, page_size=10, search="Amoxicillin")
    assert total >= 1
    assert any(c.product_name == "Amoxicillin Trihydrate" for c in items)

    # Search by severity
    high_items, high_total = repo.list_paginated(page=1, page_size=10, severity="High")
    assert high_total >= 1
    assert all(c.severity == "High" for c in high_items)

    # Clean up
    repo.delete(test_cmp)
    db_session.commit()

def test_event_repository_logging(db_session):
    repo = ComplaintRepository(db_session)
    event_repo = ComplaintEventRepository(db_session)

    test_cmp = Complaint(
        complaint_number="CMP-TEST-EVT-01",
        customer_name="Event Test Pharma",
        product_name="Paracetamol",
        batch_number="EVT-BATCH-01",
        severity="Medium",
        status="Pending Triage"
    )
    repo.create(test_cmp)
    db_session.commit()

    event = event_repo.log_event(
        complaint_id=test_cmp.id,
        event_type="AI_EXTRACTION",
        input_text="Test extraction event",
        actor="ai_copilot"
    )
    db_session.commit()

    events = event_repo.get_by_complaint_id(test_cmp.id)
    assert len(events) >= 1
    assert events[0].event_type == "AI_EXTRACTION"
    assert events[0].actor == "ai_copilot"

    # Clean up
    repo.delete(test_cmp)
    db_session.commit()
