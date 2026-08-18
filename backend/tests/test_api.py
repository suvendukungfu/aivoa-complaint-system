from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert isinstance(data["ai_model"], str) and len(data["ai_model"]) > 0

def test_log_complaint_api():
    payload = {
        "text": "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."
    }
    response = client.post("/api/complaints/log", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["complaint"]["batch_number"] == "PA240812"
    assert data["risk_assessment"]["severity"] in ["High", "Critical"]

def test_edit_complaint_api():
    current_complaint = {
        "product_name": "Paracetamol API",
        "batch_number": "PA240812",
        "quantity_affected": "25",
        "customer_name": "ABC Pharma"
    }
    payload = {
        "instruction": "Change the affected quantity to 40 kg.",
        "current_complaint": current_complaint
    }
    response = client.post("/api/complaints/edit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["complaint"]["quantity_affected"] == "40"
    assert data["complaint"]["product_name"] == "Paracetamol API"
    assert data["complaint"]["batch_number"] == "PA240812"

def test_save_and_retrieve_complaint_api():
    complaint_data = {
        "customer_name": "Apex Laboratories",
        "product_name": "Metformin HCl",
        "batch_number": "MET-TEST-01",
        "detailed_description": "Color variation in tablet batch",
        "severity": "Medium",
        "priority": "Normal"
    }
    # Save complaint
    response = client.post("/api/complaints", json=complaint_data)
    assert response.status_code == 200
    save_data = response.json()
    assert save_data["success"] is True
    complaint_id = save_data["id"]
    assert "CMP-" in save_data["complaint_number"]
    
    # Retrieve complaint by ID
    get_res = client.get(f"/api/complaints/{complaint_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["batch_number"] == "MET-TEST-01"
    assert len(retrieved["events"]) > 0

def test_completeness_api():
    incomplete = {
        "customer_name": "Small Clinic",
        "detailed_description": "Damaged bottle"
    }
    response = client.post("/api/complaints/completeness", json={"complaint": incomplete})
    assert response.status_code == 200
    data = response.json()
    assert data["completeness_score"] < 50.0
    assert "Product Name" in data["missing_critical_fields"]
    assert "Batch / Lot Number" in data["missing_critical_fields"]
