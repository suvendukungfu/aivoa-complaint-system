import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_qms_analytics_endpoint():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_complaints" in data
    assert "severity_distribution" in data
    assert "Critical" in data["severity_distribution"]
    assert "avg_completeness" in data

def test_ai_telemetry_metrics_endpoint():
    response = client.get("/api/analytics/ai-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "ai_requests_total" in data
    assert "success_rate_percent" in data
    assert "avg_latency_ms" in data
