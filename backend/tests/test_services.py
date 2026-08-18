import pytest
from backend.app.db.session import SessionLocal
from backend.app.services.complaint_service import ComplaintService

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_complaint_service_atomic_save_and_audit_creation(db_session):
    service = ComplaintService(db_session)
    payload = {
        "customer_name": "Service Test Biotech",
        "product_name": "Ibuprofen DC 90%",
        "batch_number": "IBU-SVC-01",
        "quantity_affected": "50",
        "quantity_unit": "kg",
        "detailed_description": "Service atomicity test with audit event",
        "severity": "Medium",
        "priority": "Normal"
    }

    complaint, is_new = service.save_or_create_complaint(payload, actor="qa_lead")
    assert is_new is True
    assert complaint.id is not None
    assert complaint.complaint_number.startswith("CMP-")
    assert complaint.events is not None
    assert len(complaint.events) >= 1
    assert complaint.events[0].event_type == "COMPLAINT_CREATED"

def test_complaint_service_update_preserves_id_and_creates_update_event(db_session):
    service = ComplaintService(db_session)
    # 1. Create complaint
    initial_payload = {
        "customer_name": "Initial Customer",
        "product_name": "Paracetamol",
        "batch_number": "PARA-INIT-01",
        "quantity_affected": "10",
        "severity": "Low"
    }
    complaint, is_new = service.save_or_create_complaint(initial_payload, actor="qa_analyst")
    comp_id = complaint.id
    comp_num = complaint.complaint_number

    # 2. Update complaint
    update_payload = {
        "id": comp_id,
        "complaint_number": comp_num,
        "quantity_affected": "30",
        "severity": "High"
    }
    updated_cmp, is_new_update = service.save_or_create_complaint(update_payload, actor="qa_lead")
    assert is_new_update is False
    assert updated_cmp.id == comp_id
    assert updated_cmp.quantity_affected == "30"
    assert updated_cmp.severity == "High"
    assert len(updated_cmp.events) >= 2
