"""
AIVOA Phase 9.27 — Demo Data & Reset Endpoint Unit Tests
Verifies demo data seeding and strict production guard enforcement (403 Forbidden).
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_demo_reset_seeds_three_scenarios():
    """Verify demo reset re-seeds database with 3 canonical pharmaceutical complaints and proposals"""
    res = client.post("/api/v1/demo/reset")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["seeded_scenarios"]) == 3
    assert "PA240812" in data["seeded_scenarios"]

    # Verify complaints list has records
    list_res = client.get("/api/v1/complaints")
    assert list_res.status_code == 200
    complaints = list_res.json()
    assert len(complaints) >= 3


def test_demo_reset_is_forbidden_in_production():
    """Verify demo reset endpoint is strictly disabled and returns 403 Forbidden when ENVIRONMENT == 'production'"""
    with patch("backend.app.core.config.settings.ENVIRONMENT", "production"):
        res = client.post("/api/v1/demo/reset")
        assert res.status_code == 403
        err = res.json()
        assert err["error"]["code"] == "FORBIDDEN_IN_PRODUCTION"
