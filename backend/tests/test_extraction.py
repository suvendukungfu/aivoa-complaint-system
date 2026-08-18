import pytest
from backend.app.agents.graph import run_complaint_pipeline
from backend.app.agents.nodes import fallback_deterministic_extractor, calculate_deterministic_risk

def test_nlp_extraction_acceptance():
    prompt = "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."
    
    result = run_complaint_pipeline(prompt, source="chat")
    complaint = result.get("final_complaint", {})
    risk = result.get("risk_assessment", {})
    
    # Assert core fields are accurately populated
    assert complaint.get("batch_number") == "PA240812"
    assert "Paracetamol" in (complaint.get("product_name") or "")
    assert "99.5%" in (complaint.get("product_strength") or "")
    assert "25" in str(complaint.get("quantity_affected") or "")
    mfg = complaint.get("manufacturing_date") or ""
    exp = complaint.get("expiry_date") or ""
    assert "August" in mfg or "08" in mfg or "2026" in mfg
    assert "August" in exp or "08" in exp or "2028" in exp
    
    # Assert risk triage
    assert risk.get("severity") in ["High", "Critical"]
    assert risk.get("priority") == "Urgent"
    assert len(risk.get("recommended_actions", [])) > 0
    assert len(result.get("audit_trail", [])) >= 5

def test_deterministic_fallback_extractor():
    text = "Customer XYZ Pharma reported batch BTCH9901 of Amoxicillin 500mg with 10 kg affected. Expiry date is December 2027."
    extracted = fallback_deterministic_extractor(text)
    
    assert extracted["batch_number"] == "BTCH9901"
    assert extracted["product_name"] == "Amoxicillin"
    assert extracted["quantity_affected"] == "10"
    assert extracted["expiry_date"] == "December 2027"
