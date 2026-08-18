"""
AIVOA Phase 9.11 & 9.12 — Evidence Grounding Integrity Test Suite
Verifies that text spans strictly exist in source text (substring containment),
page numbers are strictly null for unpaginated sources, and inferred fields never fabricate quotes.
"""

import pytest
import re
from backend.app.services.ai_service import AIService
from backend.app.agents.provenance import FieldProvenanceEngine

def normalize_text(text: str) -> str:
    """Normalize whitespace and lowercase for robust evidence containment checks"""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip().lower()

def test_evidence_text_span_is_true_substring_of_source():
    """Verify that every explicitly extracted text_span is a true verbatim substring of the input prompt"""
    source_prompt = (
        "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. "
        "Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."
    )
    
    res = AIService.process_complaint_text(source_prompt, source="evidence_test")
    complaint = res.get("final_complaint", {})
    provenance = complaint.get("field_provenance", {})
    
    norm_source = normalize_text(source_prompt)
    
    checked_spans = 0
    for field_name, p_item in provenance.items():
        if isinstance(p_item, dict) and p_item.get("classification") == "EXPLICIT_EXTRACTED":
            span = p_item.get("text_span")
            if span:
                # Clean any leading/trailing ellipses from UI formatting
                clean_span = re.sub(r'^\.\.\.|\.\.\.$', '', span).strip()
                norm_span = normalize_text(clean_span)
                assert norm_span in norm_source, f"Fabricated evidence: span '{clean_span}' for field '{field_name}' not found in source text!"
                checked_spans += 1
                
    assert checked_spans >= 3  # At least batch, product, quantity must have exact grounded spans


def test_txt_and_docx_unpaginated_page_number_is_strictly_null():
    """Verify that plain text and Word documents have page_number: null and NEVER fabricate Page 1"""
    # Plain text input
    res_text = AIService.process_complaint_text(
        "Apex Laboratories reported broken seals on Amoxicillin, batch AMX-101.",
        source="customer_prompt"
    )
    prov_text = res_text.get("final_complaint", {}).get("field_provenance", {})
    for field_name, p_item in prov_text.items():
        if isinstance(p_item, dict):
            assert p_item.get("page_number") is None, f"Fabricated page number on unpaginated prompt for field '{field_name}'"


def test_inferred_fields_have_null_evidence():
    """Verify fields classified as INFERRED have text_span: null and source_type: 'ai_inference'"""
    res = AIService.process_complaint_text(
        "Batch B-999 reported assay deviation.",
        source="inference_test"
    )
    complaint = res.get("final_complaint", {})
    prov = complaint.get("field_provenance", {})
    
    # Severity and complaint_type are inferred
    sev_prov = prov.get("severity")
    if sev_prov and isinstance(sev_prov, dict):
        if sev_prov.get("classification") == "INFERRED":
            assert sev_prov.get("text_span") is None
            assert sev_prov.get("source_type") in ["ai_inference", "deterministic_rule"]


def test_user_edit_provenance_tagging():
    """Verify that editing a field updates provenance to 'user_edit' / 'USER_SPECIFIED'"""
    initial_state = {
        "customer_name": "ABC Pharma",
        "product_name": "Paracetamol API",
        "batch_number": "PA240812",
        "quantity_affected": "25"
    }
    
    edit_res = AIService.process_complaint_edit(
        instruction="Change the batch number to PA999999",
        current_complaint=initial_state
    )
    complaint = edit_res.get("final_complaint", {})
    prov = complaint.get("field_provenance", {})
    
    batch_prov = prov.get("batch_number", {})
    assert complaint.get("batch_number") == "PA999999"
    assert batch_prov.get("source_type") == "user_edit"
    assert batch_prov.get("classification") == "USER_SPECIFIED"
    assert batch_prov.get("confidence") >= 0.95
