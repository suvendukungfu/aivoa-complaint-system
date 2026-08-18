"""
AIVOA Phase 9.5 & 9.6 — AI Failure & Database Resilience Test Suite
Verifies that AI provider outages, invalid credentials, timeouts, malformed outputs,
and database connection drops fail safely without application crashes or corrupted state.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from backend.app.main import app
from backend.app.services.ai_service import AIService
from backend.app.agents.providers import GroqProvider, ModelExecutionResult

client = TestClient(app)

# --- PHASE 9.5: AI FAILURE TESTS ---

def test_groq_unavailable_falls_back_deterministically():
    """Verify system gracefully falls back to deterministic extraction when Groq is unavailable"""
    with patch.object(GroqProvider, "is_available", return_value=False):
        res = AIService.process_complaint_text(
            "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. 25 kg affected.",
            source="test_fallback"
        )
        assert res.get("final_complaint") is not None
        complaint = res["final_complaint"]
        assert complaint.get("customer_name") == "ABC Pharma"
        assert "Paracetamol" in complaint.get("product_name", "")
        assert complaint.get("batch_number") == "PA240812"
        # Audit trail must reflect fallback
        audit = res.get("audit_trail", [])
        assert any("deterministic" in a.get("description", "").lower() for a in audit)


def test_groq_invalid_api_key_handles_gracefully():
    """Verify invalid API key triggers multi-model fallback and deterministic safety net without crash"""
    provider = GroqProvider(api_key="gsk_invalid_test_key_12345")
    with patch("backend.app.agents.providers.get_llm_provider", return_value=provider):
        res = AIService.process_complaint_text(
            "Customer Novartis noted crushed cartons for Amoxicillin, batch AMX-101. 50 boxes.",
            source="test_invalid_key"
        )
        assert res.get("final_complaint") is not None


def test_groq_timeout_handles_gracefully():
    """Verify timeout exception triggers fallback without crashing the process"""
    with patch.object(GroqProvider, "invoke_with_telemetry", side_effect=TimeoutError("Groq request timed out")):
        res = AIService.process_complaint_text(
            "Metformin HCl 500mg batch MET-999 had OOS assay. Metro Hospital.",
            source="test_timeout"
        )
        assert res.get("final_complaint") is not None


def test_groq_malformed_json_response_recovers_safely():
    """Verify malformed non-JSON response from LLM is handled safely"""
    bad_result = ModelExecutionResult(
        content="<<<THINKING>>> Sorry I cannot format this as JSON properly {broken",
        requested_model="gemma2-9b-it",
        actual_model="gemma2-9b-it",
        fallback_used=False,
        fallback_reason=None,
        latency_ms=120,
        success=True
    )
    with patch.object(GroqProvider, "invoke_with_telemetry", return_value=bad_result):
        res = AIService.process_complaint_text(
            "ABC Pharma reported visible black particles in Paracetamol API, batch PA240812.",
            source="test_malformed_json"
        )
        assert res.get("final_complaint") is not None
        complaint = res["final_complaint"]
        assert complaint.get("batch_number") == "PA240812"


def test_groq_empty_response_recovers_safely():
    """Verify empty response from LLM provider triggers deterministic fallback"""
    empty_result = ModelExecutionResult(
        content="",
        requested_model="gemma2-9b-it",
        actual_model="gemma2-9b-it",
        fallback_used=False,
        fallback_reason="Empty response",
        latency_ms=80,
        success=False
    )
    with patch.object(GroqProvider, "invoke_with_telemetry", return_value=empty_result):
        res = AIService.process_complaint_text(
            "Apex Laboratories reported broken seal on Ciprofloxacin batch CIP-404.",
            source="test_empty"
        )
        assert res.get("final_complaint") is not None
        complaint = res["final_complaint"]
        assert complaint.get("customer_name") == "Apex Laboratories"


# --- PHASE 9.6: DATABASE FAILURE TESTS ---

def test_database_failure_readiness_probe_returns_503():
    """Verify /health/ready returns 503 Service Unavailable when DB is disconnected"""
    with patch("sqlalchemy.orm.Session.execute", side_effect=OperationalError("Connection refused", params=None, orig=Exception())):
        res = client.get("/api/v1/health/ready")
        assert res.status_code == 503
        data = res.json()
        assert data["status"] == "not_ready"


def test_database_failure_on_save_returns_500_safely():
    """Verify database write failure returns clean error response without partial state"""
    with patch("backend.app.repositories.complaint_repository.ComplaintRepository.create", side_effect=OperationalError("Database disk full", params=None, orig=Exception())):
        res = client.post(
            "/api/v1/complaints/save",
            json={
                "customer_name": "Test Customer",
                "product_name": "Paracetamol API",
                "batch_number": "BATCH-ERR-01"
            }
        )
        # Should return structured 500 error
        assert res.status_code in [500, 503]
        err = res.json()
        assert "error" in err or "detail" in err
