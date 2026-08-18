import pytest
from backend.app.agents.graph import run_edit_pipeline

def test_safe_merge_preserves_untouched_fields():
    # Setup initial state
    initial_complaint = {
        "complaint_source": "Direct Email",
        "customer_name": "ABC Pharmaceuticals",
        "product_name": "Paracetamol API",
        "product_strength": "99.5%",
        "batch_number": "PA240812",
        "manufacturing_date": "12 August 2026",
        "expiry_date": "August 2028",
        "quantity_affected": "25",
        "quantity_unit": "kg",
        "complaint_type": "Foreign Matter / Contamination",
        "complaint_date": "17 August 2026",
        "detailed_description": "Black particles in top layer",
        "severity": "High",
        "priority": "Urgent"
    }

    # Instruction: Only change quantity to 40 kg
    result = run_edit_pipeline("Change the affected quantity to 40 kg.", initial_complaint)
    updated = result.get("final_complaint", {})
    
    # Assert ONLY quantity changed
    assert str(updated.get("quantity_affected")) == "40"
    assert updated.get("quantity_unit") == "kg"
    
    # Assert all other fields are 100% strictly preserved
    assert updated.get("product_name") == "Paracetamol API"
    assert updated.get("product_strength") == "99.5%"
    assert updated.get("batch_number") == "PA240812"
    assert updated.get("customer_name") == "ABC Pharmaceuticals"
    assert updated.get("manufacturing_date") == "12 August 2026"
    assert updated.get("expiry_date") == "August 2028"
    assert updated.get("detailed_description") == "Black particles in top layer"
    assert updated.get("severity") == "High"
    assert updated.get("priority") == "Urgent"

def test_batch_number_edit_preserves_fields():
    initial_complaint = {
        "customer_name": "Apex Pharma",
        "product_name": "Ibuprofen",
        "batch_number": "OLD-BATCH-100",
        "quantity_affected": "50"
    }

    result = run_edit_pipeline("Change the batch number to PA240813", initial_complaint)
    updated = result.get("final_complaint", {})

    assert updated.get("batch_number") == "PA240813"
    assert updated.get("customer_name") == "Apex Pharma"
    assert updated.get("product_name") == "Ibuprofen"
    assert updated.get("quantity_affected") == "50"
