# AIVOA Phase 9.1 — Critical Model Compliance Report

**Audit Date**: August 18, 2026  
**Auditor**: Principal AI Systems Engineer & AI Reliability Architect  
**Subject**: Primary Model Configuration, Fallback Transparency, and Telemetry Truthfulness

---

## 1. Before

* **Active Configured Model**: `openai/gpt-oss-20b` (temporarily set in `.env` and `config.py`)
* **Health Endpoint Output**: Indicated `openai/gpt-oss-20b` as active engine without differentiating configured primary model from runtime fallback execution.
* **Risk**: Non-compliance with the explicit AIVOA assignment requirement specifying **Groq** + **`gemma2-9b-it`**.

---

## 2. Root Cause

1. **Upstream Cloud Decommissioning**: Groq cloud API returned `HTTP 400 (model_decommissioned)` when invoking `gemma2-9b-it` and legacy `llama3-8b-8192`.
2. **Temporary Workaround in Phase 9 Testing**: To avoid triggering exception catch-blocks and rate limits on every offline test iteration, `GROQ_MODEL` was changed to `openai/gpt-oss-20b` (an active model hosted on Groq).
3. **Flaw**: Changing the primary requested model violated the requirement that `gemma2-9b-it` must be the primary requested target.

---

## 3. After (Remediation)

* **Primary Configured Provider**: `Groq` (`GroqProvider`)
* **Primary Configured Model**: `gemma2-9b-it` (restored in `.env`, `.env.example`, `backend/app/core/config.py`, `docker-compose.prod.yml`, and `frontend`)
* **Configured Fallback Model**: `llama-3.3-70b-versatile` / `openai/gpt-oss-120b`
* **Telemetry Fields Recorded**:
  - `requested_provider`: `"groq"`
  - `requested_model`: `"gemma2-9b-it"`
  - `actual_provider`: `"groq"`
  - `actual_model`: Exact responding model string
  - `fallback_used`: `True` if and only if `actual_model != "gemma2-9b-it"`
  - `fallback_reason`: Exact API error from primary attempt
* **Health Endpoint (`/api/health`)**:
  - Differentiates `configured_model` (`"gemma2-9b-it"`) from `last_successful_model` (`"openai/gpt-oss-120b"`) and `fallback` (`true`).

---

## 4. Verification

### A. Live Health Probe
```bash
curl -s http://127.0.0.1:8000/api/health
```
**Response**:
```json
{
  "status": "healthy",
  "service": "aivoa-backend",
  "version": "v1",
  "database_connected": true,
  "database_type": "sqlite",
  "groq_configured": true,
  "ai_model": "gemma2-9b-it",
  "environment": "development",
  "ai": {
    "provider": "groq",
    "requested_model": "gemma2-9b-it",
    "configured_model": "gemma2-9b-it",
    "fallback_configured": "llama-3.3-70b-versatile",
    "last_successful_model": "openai/gpt-oss-120b",
    "last_successful_provider": "groq",
    "fallback": true
  }
}
```

### B. Live Complaint Intake Telemetry
```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/complaints/log \
  -H "Content-Type: application/json" \
  -d '{"text":"ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. 25 kg affected."}'
```
**Audit Trail Entry**:
`"Extracted structured fields using Groq (openai/gpt-oss-120b) in 1934ms [Fallback from gemma2-9b-it]"`

### C. Real LLM Evaluation Runner
```bash
python evaluation/real_llm_runner.py --limit 5
```
**Output**:
```
===========================================================================
📊 REAL GROQ LLM VERIFICATION SUMMARY
===========================================================================
Evaluation Mode: REAL_LLM

Provider:
Groq

Requested Model:
gemma2-9b-it

Actual Model:
openai/gpt-oss-120b

Fallback:
true

Reason:
Primary model 'gemma2-9b-it' unavailable on Groq API

Total Test Cases: 5
Passed Invariant Checks: 5 / 5 (100.0%)
Average Turnaround Latency: 6908.2 ms
===========================================================================
```

---

## 5. Test Results

| Test Category | Command | Result |
|---|---|---|
| **Backend Test Suite** | `backend/.venv/bin/pytest backend/tests/ -v` | ✅ **76/76 PASSED (100%)** |
| **Frontend Test Suite** | `cd frontend && npm test -- --run` | ✅ **14/14 PASSED (100%)** |
| **Frontend Production Build** | `cd frontend && npm run build` | ✅ **0 Errors (Clean)** |
| **Real AI Invariants & Compliance** | `backend/.venv/bin/pytest backend/tests/test_real_ai_smoke.py -v` | ✅ **1/1 PASSED (100%)** |
| **Real LLM Batch Runner** | `python evaluation/real_llm_runner.py --limit 5` | ✅ **5/5 PASSED (100%)** |
| **Total Automated Tests** | All Suites | ✅ **91/91 GREEN** |

---

## 6. Remaining Limitations & Honest Declarations

1. **Upstream Groq Model Availability**: As of August 2026, Groq's cloud infrastructure decommissioned `gemma2-9b-it` in favor of newer open-weight models. The system will continue to request `gemma2-9b-it` as its primary target and failover gracefully to active fallbacks without false attribution.
2. **Rate Limits**: Free tier Groq API keys are subject to 200k daily token limits. Multi-model fallback ensures high availability when individual tier models hit capacity.
