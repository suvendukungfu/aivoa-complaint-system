# AIVOA — Live Demo Emergency Recovery Runbook

---

## 1. Quick Emergency Triage

If any component fails during a live interview demonstration, follow these instant 10-second recovery procedures.

---

### Scenario 1: Backend API Stops Responding / Crashes
**Symptoms:** Network error toast in UI, red health indicator.  
**Recovery Action:**
```bash
# 1. Restart backend uvicorn server immediately
backend/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &

# 2. Verify health in terminal
curl -s http://127.0.0.1:8000/api/health
```

---

### Scenario 2: Frontend Blank Page or Build Stale
**Symptoms:** Page does not load or shows old cache.  
**Recovery Action:**
```bash
# 1. Hard refresh browser
Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows/Linux)

# 2. If dev server stopped, restart frontend
cd frontend && npm run dev
```

---

### Scenario 3: Groq Cloud API Times Out or Rate Limits
**Symptoms:** Copilot displays *"AI analysis unavailable"*.  
**Talking Point & Action:**
> *"Notice how gracefully the system handles API unavailability: our error boundary isolates the failure, informs the user that existing data is preserved, and falls back to our local deterministic rule engine. No data is lost."*
```bash
# Verify fallback model execution in terminal
backend/.venv/bin/pytest backend/tests/test_real_ai_smoke.py -q
```

---

### Scenario 4: Demo State Corrupted / Need Fresh Start
**Symptoms:** Unwanted test complaints in review queue or dirty form state.  
**Recovery Action:**
```bash
# Instant 1-click deterministic reseeding
curl -X POST http://127.0.0.1:8000/api/v1/demo/reset
```
*Then press `F5` / Refresh in browser.*

---

### Scenario 5: Document Upload Rejection / Parsing Issue
**Symptoms:** Upload error or unsupported format.  
**Recovery Action:**
- Use the verified sample files in `sample_data/`:
  - `sample_data/sample_complaint.pdf`
  - `sample_data/sample_complaint.txt`
  - `sample_data/sample_complaint.docx`
- Or paste the canonical Scenario A text directly into the Copilot chat input.

---

## 2. 2-Minute Code Walkthrough Sequence

If asked to show the code, open ONLY these 8 files in order:

1. **[`CopilotPanel.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/features/copilot/CopilotPanel.tsx)**: Embedded copilot interface and state dispatcher.
2. **[`routes/complaints.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/api/routes/complaints.py)**: REST API routes and RBAC authorization headers.
3. **[`agents/graph.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/graph.py)**: LangGraph state machine definition and node routing.
4. **[`agents/nodes.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/nodes.py)**: Extraction, validation, and proposal generation logic.
5. **[`services/complaint_service.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/services/complaint_service.py)**: Business rules, optimistic concurrency, and state transitions.
6. **[`agents/provenance.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/provenance.py)**: Verbatim text span search and confidence calibration.
7. **[`agents/providers.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/providers.py)**: Groq client, fallback execution, and model telemetry.
8. **[`models/complaint.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/models/complaint.py)**: SQLAlchemy models for complaints, proposals, and immutable audit events.
