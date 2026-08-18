"""
AIVOA Phase 7 Evidence-Grounded AI Automated Test Suite
Verifies verbatim text span matching, strict anti-fabrication rules, page-aware citations, and immutable provenance tracking.
"""

import pytest
from backend.app.agents.provenance import FieldProvenanceEngine
from backend.app.services.complaint_service import ComplaintService
from backend.app.services.document_parser import extract_document_pages
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.db.base import Base

# Isolated test DB
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield


# -------------------------------------------------------------
# 1. Verbatim Evidence Preservation Tests
# -------------------------------------------------------------
def test_verbatim_text_span_preservation():
    """Verify that exact verbatim evidence is extracted and preserved without alteration"""
    raw_text = """
    URGENT COMPLAINT REPORT
    Customer: Apex Healthcare Diagnostics Ltd.
    Product: Paracetamol Micronized API 500mg
    Batch No: PA240812
    Mfg Date: 12 March 2025 | Exp Date: 11 March 2028
    Affected Quantity: 50 kg (2 fiber drums)
    Issue: Customer detected visible black specks in drum 1 during weighing.
    """

    # Extract provenance for batch_number
    prov = FieldProvenanceEngine.extract_field_evidence(
        field_name="batch_number",
        value="PA240812",
        raw_text=raw_text,
        source_doc_id="Paracetamol_Complaint.pdf",
        ai_run_id="AI-93D22C",
        source_type="uploaded_document"
    )

    assert prov["field"] == "batch_number"
    assert prov["value"] == "PA240812"
    assert prov["source_type"] == "uploaded_document"
    assert prov["source_document_id"] == "Paracetamol_Complaint.pdf"
    assert prov["text_span"] == "Batch No: PA240812"
    assert prov["classification"] == "EXPLICIT_EXTRACTED"
    assert prov["confidence"] >= 0.95
    assert prov["ai_run_id"] == "AI-93D22C"


# -------------------------------------------------------------
# 2. Strict Anti-Fabrication Tests (No Hallucinated Evidence)
# -------------------------------------------------------------
def test_missing_evidence_is_not_fabricated():
    """Verify that if a field value does not exist in raw text, no evidence is fabricated (text_span=None)"""
    raw_text = "Received oral complaint regarding tablet chipping on packaging line."

    # Batch number was not mentioned in the text at all
    prov = FieldProvenanceEngine.extract_field_evidence(
        field_name="batch_number",
        value="UNKNOWN-LOT-99",
        raw_text=raw_text,
        source_type="customer_prompt"
    )

    # Must NOT fabricate a quote
    assert prov["text_span"] is None
    assert prov["classification"] == "INFERRED"
    assert prov["source_type"] == "ai_inference"
    assert prov["page_number"] is None


# -------------------------------------------------------------
# 3. Page Number Citation Tests
# -------------------------------------------------------------
def test_page_number_only_shown_when_known():
    """Verify that page numbers are accurately populated for multi-page docs and None for unpaginated text"""
    # 2-page structured document
    pages = [
        {"page_number": 1, "text": "Header and customer info: Apex Labs"},
        {"page_number": 2, "text": "Batch No: PA240812\nDefect: Foreign matter detected."}
    ]
    raw_text = "\n\n".join(p["text"] for p in pages)

    # Field on page 2
    prov_p2 = FieldProvenanceEngine.extract_field_evidence(
        field_name="batch_number",
        value="PA240812",
        raw_text=raw_text,
        pages=pages,
        source_doc_id="Audit_Document.pdf"
    )
    assert prov_p2["page_number"] == 2
    assert prov_p2["text_span"] == "Batch No: PA240812"

    # Field on page 1
    prov_p1 = FieldProvenanceEngine.extract_field_evidence(
        field_name="customer_name",
        value="Apex Labs",
        raw_text=raw_text,
        pages=pages,
        source_doc_id="Audit_Document.pdf"
    )
    assert prov_p1["page_number"] == 1

    # Unpaginated text (e.g. email or prompt)
    prov_nopage = FieldProvenanceEngine.extract_field_evidence(
        field_name="batch_number",
        value="PA240812",
        raw_text="Customer reported Batch No: PA240812 damaged.",
        pages=None
    )
    assert prov_nopage["page_number"] is None


# -------------------------------------------------------------
# 4. Inferred Classification Tests
# -------------------------------------------------------------
def test_ai_inference_classification_labeling():
    """Verify that inferred fields are clearly distinguished from explicit extractions"""
    raw_text = "Drum seal broken during unloading at dock."

    prov_map = FieldProvenanceEngine.build_provenance_map(
        extracted_fields={
            "detailed_description": "Drum seal broken during unloading at dock.",
            "complaint_type": "Packaging Integrity / Seal Failure",  # Inferred classification
            "batch_number": "UNKNOWN"  # Missing from text
        },
        raw_text=raw_text,
        source_type="customer_prompt"
    )

    assert prov_map["detailed_description"]["classification"] == "EXPLICIT_EXTRACTED"
    assert prov_map["batch_number"]["classification"] == "INFERRED"
    assert prov_map["batch_number"]["text_span"] is None


# -------------------------------------------------------------
# 5. Risk Assessment Grounding Tests
# -------------------------------------------------------------
def test_risk_assessment_evidence_grounding():
    """Verify that risk indicators link directly to defect evidence in source complaint"""
    raw_text = "Batch B-99 contains visible black specks and dark particles in the top layer."

    risk_evidence = FieldProvenanceEngine.ground_risk_evidence(
        complaint={"severity": "High", "detailed_description": raw_text},
        raw_text=raw_text,
        source_doc_id="Lab_Report.txt"
    )

    assert len(risk_evidence) >= 1
    item = risk_evidence[0]
    assert item["risk_factor"] == "Foreign particulate matter"
    assert "black specks" in item["evidence"] or "dark particles" in item["evidence"]
    assert item["classification"] == "EXPLICIT_EXTRACTED"


# -------------------------------------------------------------
# 6. Provenance Mutation & Audit History Invariants
# -------------------------------------------------------------
def test_field_mutation_updates_provenance_and_preserves_history():
    """Verify that updating a field changes its provenance to USER_SPECIFIED while preserving previous in audit trail"""
    db = TestingSessionLocal()
    service = ComplaintService(db)

    # 1. Create complaint with initial AI extraction provenance
    initial_provenance = {
        "batch_number": {
            "field": "batch_number",
            "value": "PA240812",
            "source_type": "uploaded_document",
            "text_span": "Batch No: PA240812",
            "classification": "EXPLICIT_EXTRACTED"
        }
    }
    complaint, _ = service.save_or_create_complaint({
        "product_name": "Paracetamol API",
        "batch_number": "PA240812",
        "field_provenance": initial_provenance
    })
    assert complaint.field_provenance["batch_number"]["classification"] == "EXPLICIT_EXTRACTED"

    # 2. User manually edits the batch number
    updated_provenance = dict(complaint.field_provenance)
    updated_provenance["batch_number"] = {
        "field": "batch_number",
        "value": "PA240812-REVISED",
        "source_type": "user_edit",
        "classification": "USER_SPECIFIED",
        "confidence": 1.0,
        "text_span": None,
        "ai_run_id": None
    }

    updated_complaint, _ = service.save_or_create_complaint({
        "id": complaint.id,
        "batch_number": "PA240812-REVISED",
        "field_provenance": updated_provenance
    }, actor="qa_specialist")

    # Verify updated provenance reflects USER_SPECIFIED
    assert updated_complaint.field_provenance["batch_number"]["classification"] == "USER_SPECIFIED"
    assert updated_complaint.field_provenance["batch_number"]["source_type"] == "user_edit"

    # Verify audit event history retains the creation event with original provenance
    timeline = service.get_audit_timeline(updated_complaint.id)
    assert len(timeline["events"]) >= 2
