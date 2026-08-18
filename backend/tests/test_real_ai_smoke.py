"""
AIVOA Phase 9.1 & 9.4 — Canonical Real AI Smoke Test & Semantic Invariant Suite
Tests the flagship complaint intake path against strict model compliance and semantic quality invariants.

Verification Rules:
1. Provider must be 'groq'
2. Requested model must be 'gemma2-9b-it'
3. If fallback occurs, actual_model != requested_model and fallback_used is True with documented reason
4. If primary model succeeds, actual_model == 'gemma2-9b-it' and fallback_used is False
"""

import pytest
from backend.app.services.ai_service import AIService
from backend.app.core.config import settings

CANONICAL_PROMPT = (
    "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. "
    "Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."
)

VALID_MFG_DATES = {"12 August 2026", "2026-08-12", "12/08/2026", "August 12, 2026", "Aug 12, 2026"}
VALID_EXP_DATES = {"August 2028", "2028-08", "2028-08-01", "Aug 2028"}


def test_canonical_ai_smoke_extraction_invariants():
    """Verify model compliance and semantic invariants for canonical pharmaceutical complaint intake"""
    res = AIService.process_complaint_text(CANONICAL_PROMPT, source="smoke_test")
    assert res is not None
    assert "final_complaint" in res

    # --- MODEL COMPLIANCE & TELEMETRY VERIFICATION ---
    meta = res.get("model_metadata", {})
    assert meta.get("requested_provider") == "groq", f"Unexpected requested provider: {meta.get('requested_provider')}"
    assert meta.get("requested_model") == "gemma2-9b-it", f"Unexpected requested model: {meta.get('requested_model')}"

    fallback_used = meta.get("fallback_used", False)
    actual_model = meta.get("actual_model")

    if fallback_used:
        # Fallback invariant: actual model must differ from requested model, and fallback reason must be documented
        assert actual_model != "gemma2-9b-it", "Fallback flagged but actual model was still gemma2-9b-it"
        assert meta.get("fallback_reason") is not None, "Fallback occurred but fallback_reason was not recorded!"
    else:
        # Primary success invariant: actual model must be strictly gemma2-9b-it
        assert actual_model == "gemma2-9b-it", f"Primary succeeded but actual model was {actual_model} instead of gemma2-9b-it"
        assert meta.get("actual_provider") == "groq"

    # --- SEMANTIC QUALITY INVARIANTS ---
    complaint = res.get("final_complaint", {})
    assert complaint is not None

    # 1. Customer Name invariant
    assert complaint.get("customer_name") == "ABC Pharma"

    # 2. Product Name invariant — must contain "Paracetamol"
    assert "Paracetamol" in (complaint.get("product_name") or "")

    # 3. Product Strength (if extracted)
    strength = complaint.get("product_strength") or ""
    if strength:
        assert "99.5" in strength

    # 4. Batch / Lot Number preservation
    assert complaint.get("batch_number") == "PA240812"

    # 5. Dates parsing — accept multiple valid normalizations
    mfg = complaint.get("manufacturing_date") or ""
    assert mfg in VALID_MFG_DATES or "2026" in mfg, (
        f"Manufacturing date '{mfg}' not in accepted formats: {VALID_MFG_DATES}"
    )
    exp = complaint.get("expiry_date") or ""
    assert exp in VALID_EXP_DATES or "2028" in exp, (
        f"Expiry date '{exp}' not in accepted formats: {VALID_EXP_DATES}"
    )

    # 6. Quantity & Unit
    qty_str = str(complaint.get("quantity_affected") or "")
    assert "25" in qty_str
    unit = (complaint.get("quantity_unit") or "").lower()
    if unit:
        assert unit == "kg"

    # 7. Defect Classification & Semantic Keywords
    complaint_type = (complaint.get("complaint_type") or "").lower()
    desc = (complaint.get("detailed_description") or "").lower()
    combined = complaint_type + " " + desc
    assert any(kw in combined for kw in [
        "foreign", "matter", "particle", "contaminat", "black", "visible"
    ]), f"No defect keyword found in: complaint_type='{complaint_type}', description='{desc}'"

    # 8. Severity & Priority valid enums
    assert complaint.get("severity") in ["Low", "Medium", "High", "Critical"]
    assert complaint.get("priority") in ["Low", "Normal", "High", "Urgent"]
    assert complaint.get("severity") in ["High", "Critical"]

    # 9. Completeness Score valid range (if present)
    score = complaint.get("completeness_score")
    if score is not None:
        assert 0.0 <= float(score) <= 100.0
        assert float(score) >= 70.0

    # 10. Provenance Non-Fabrication Invariant (if present)
    provenance = complaint.get("field_provenance", {})
    if provenance:
        for field_name, p_item in provenance.items():
            if isinstance(p_item, dict):
                if p_item.get("classification") == "INFERRED":
                    assert p_item.get("text_span") is None, (
                        f"Inferred field '{field_name}' fabricated a text span!"
                    )
                if p_item.get("classification") == "EXPLICIT_EXTRACTED":
                    assert p_item.get("confidence", 0.0) >= 0.80
