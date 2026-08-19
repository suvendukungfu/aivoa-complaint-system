# AIVOA

**AI-Assisted Pharmaceutical Customer Complaint Management System**

[![CI Pipeline](https://github.com/suvendukungfu/aivoa-complaint-system/actions/workflows/ci.yml/badge.svg)](https://github.com/suvendukungfu/aivoa-complaint-system/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-orange.svg)](https://langchain-ai.github.io/langgraph/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Redux Toolkit](https://img.shields.io/badge/Redux-Toolkit-purple.svg)](https://redux-toolkit.js.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16.0-336791.svg)](https://www.postgresql.org)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-red.svg)](https://alembic.sqlalchemy.org)
[![Tests Passing](https://img.shields.io/badge/Tests-91%20Passed-brightgreen.svg)](TEST_MATRIX.md)

---

## 1. Problem

In pharmaceutical manufacturing (APIs and Finished Dosage Forms), customer complaints arrive via unstructured emails, PDF certificates of analysis, supplier letters, and phone transcripts. 

Traditional intake is manual and slow. However, directly applying unconstrained LLMs in regulated quality environments introduces critical hazards:
- **Hallucinated parameters** (e.g. fabricated batch numbers, incorrect strengths).
- **Ungrounded risk assessments** without traceable document evidence.
- **Silent quality downgrades** without Qualified Person oversight.
- **Unverified state transitions** violating change-control principles.

---

## 2. Product

**AIVOA** bridges unstructured quality complaints with strict pharmaceutical Quality Management Systems (QMS). 

AI operates strictly as an intake, triage, and drafting copilot under supervisory human oversight:
- AI extractions are staged as proposals (`AI_PROPOSED`) rather than final authority.
- Every parameter is traceable to source text spans.
- Deterministic safety floor policies prevent AI from downplaying critical defects.
- All human reviews, modifications, and overrides are immutably logged.

---

## 3. Key Features

1. **Interactive Dual-Panel Workspace**: Synchronized 16-field QMS intake form paired with a conversational Quality Copilot.
2. **Multi-Format Document Parsing**: Ingests PDF, DOCX, TXT, and EML documents with page-level mapping.
3. **Evidence-Grounded AI**: Verbatim text span citations and provenance tracking for extracted parameters.
4. **Human-in-the-Loop Review**: Reviewer workspace with `[Approve]`, `[Reject]`, and `[Human Override]` actions.
5. **Complaint Lifecycle State Machine**: Enforces valid forward transitions (`DRAFT` → `SUBMITTED` → `PENDING_TRIAGE` → `UNDER_REVIEW` → `INVESTIGATION` → `QUALITY_DECISION` → `CLOSED`).
6. **Deterministic RiskPolicyEngine**: Enforces safety floors (e.g. particulate contamination cannot be downgraded below `High`).
7. **Immutable Audit Ledger**: Append-only event history inspired by 21 CFR Part 11 principles, capturing exact old/new diffs.
8. **Role-Based Access Control**: Granular authorization for Operators, Quality Reviewers, Managers, and Admins.

---

## 4. Architecture

```
User Action / Document Upload
              │
              ▼
[ React 19 + Redux Frontend ] (CopilotPanel, ComplaintForm, ReviewWorkspace)
              │ HTTP POST /api/v1/complaints/log (X-Request-ID, Idempotency-Key)
              ▼
[ FastAPI Ingress Layer ] (Pydantic v2 schemas, AuthorizationService)
              │
              ▼
[ AIService & ComplaintService ]
              │
              ▼
[ LangGraph StateGraph ] (Compiled cyclic graph)
  ├── normalize_input_node (Prompt injection scanning)
  ├── extract_data_node (GroqProvider inference)
  ├── validate_fields_node (QMS schema data dictionary validation)
  ├── calculate_completeness_node (QMS completeness scoring)
  ├── assess_risk_node (RiskPolicyEngine deterministic floor evaluation)
  ├── detect_duplicates_node (Historical batch & product matching)
  └── format_response_node (Redux payload generation)
              │
              ▼
[ SafetyGate & Provenance ] (backend/app/agents/safety.py, provenance.py)
              │
              ▼
[ Relational Persistence ] (PostgreSQL in production / SQLite local fallback)
  ├── Complaint (Record state, lifecycle status, completeness score)
  ├── AIProposal (AI-generated recommendations awaiting review)
  └── ComplaintEvent (Immutable audit log with field diffs)
```

---

## 5. AI Workflow

LangGraph coordinates intake through a functional state graph:
1. **Security Scan**: Checks for prompt injections before tokenization.
2. **LLM Extraction**: Requests structured fields from Groq.
3. **Safety Gate Sanitization**: Strips unauthorized keys and normalizes enums.
4. **Deterministic Backfill**: Ensures critical parameters are populated if LLM misses them.
5. **Policy Evaluation**: Calculates risk score and applies deterministic safety floors.
6. **Audit Staging**: Compiles telemetry (model, latency, tokens, fallback status) into the immutable audit trail.

---

## 6. Evidence Grounding

Every extracted field is paired with evidence metadata:
- **`EXPLICIT_EXTRACTED`**: Verbatim substring found in source text with character offsets (`start_char`, `end_char`) and page number.
- **`INFERRED`**: Derived by AI reasoning (e.g. risk score). Has `text_span=None` and is explicitly labeled to prevent fabricated citations.
- **`USER_EDITED`**: Manually updated by a human operator, preserving modification lineage.

---

## 7. Human-in-the-Loop (HITL)

AI recommendations are never treated as final QMS decisions:
1. When AI recommends triage severity or actions, an `AIProposal` is created with status `AI_PROPOSED`.
2. Qualified Reviewers inspect the proposal alongside verbatim evidence and duplicate warnings.
3. Reviewers can approve, reject (with mandatory reason), or override values.
4. Human overrides require a documented GxP justification string, which updates the proposal to `MODIFIED` and logs a `HUMAN_OVERRIDE` audit event.

---

## 8. Complaint Lifecycle

The `ComplaintStateMachine` enforces valid forward state progression:

$$\text{DRAFT} \longrightarrow \text{SUBMITTED} \longrightarrow \text{PENDING\_TRIAGE} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{INVESTIGATION} \longrightarrow \text{QUALITY\_DECISION} \longrightarrow \text{CLOSED}$$

Any attempt to skip steps or transition backwards returns `HTTP 409 Conflict`.

---

## 9. Security

1. **Prompt Injection Defense**: Token heuristic scanner + Pydantic SafetyGate parser containment.
2. **Role-Based Access Control**: `AuthorizationService` enforces role permissions (Operators intake; Reviewers approve proposals; Managers close complaints).
3. **Optimistic Concurrency Control**: Prevents double-approval collisions on concurrent review actions.
4. **Path Traversal & Size Limits**: Strict filename sanitization and 10 MB payload limits.

---

## 10. AI Evaluation

A dedicated evaluation suite tests extraction quality against canonical pharmaceutical test cases:

```bash
# Run offline semantic invariant evaluation
pytest backend/tests/test_extraction.py -v

# Run live Groq LLM verification
python evaluation/real_llm_runner.py --limit 5
```

---

## 11. Model Configuration

* **Primary Configured Model**: `gemma2-9b-it` via **Groq Cloud API** (`GROQ_MODEL=gemma2-9b-it`)
* **Configured Fallback Models**: `llama-3.3-70b-versatile` / `openai/gpt-oss-120b`
* **Truthful Observability**: When upstream Groq infrastructure deprecates or rate-limits a model, the `GroqProvider` cascades to active fallbacks and records exact requested vs actual model telemetry:

```json
{
  "requested_provider": "groq",
  "requested_model": "gemma2-9b-it",
  "actual_provider": "groq",
  "actual_model": "openai/gpt-oss-120b",
  "fallback_used": true,
  "fallback_reason": "Primary model 'gemma2-9b-it' unavailable on Groq API"
}
```

---

## 12. Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- (Optional) Docker & Docker Compose

### Local Development
```bash
# 1. Backend Setup
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env

# 2. Start Backend Server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# 3. Frontend Setup (in a new terminal)
cd frontend
npm install
npm run dev
```

- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 13. Demo

The application includes 3 built-in canonical demonstration scenarios:
1. **Scenario 1**: Foreign particulate contamination (`Paracetamol API 99.5%`, batch `PA240812`)
2. **Scenario 2**: Packaging defect & damaged drum seals (`Amoxicillin Trihydrate`, lot `AMX-2026-884`)
3. **Scenario 3**: Dissolution & Out of Specification (`Metformin HCl 500mg`, batch `MET-500-A`)

See [FINAL_DEMO_SCRIPT.md](FINAL_DEMO_SCRIPT.md) for a complete 10-minute presentation guide.

---

## 14. Tests

```bash
# Run all backend unit, security, RBAC, and invariant tests
backend/.venv/bin/pytest backend/tests/ -v

# Run frontend tests
cd frontend && npm test -- --run

# Run frontend production build
cd frontend && npm run build

# Run frontend linter
cd frontend && npm run lint
```

**Verified Test Summary**:
- Backend: **76 / 76 Passed (100%)**
- Frontend: **14 / 14 Passed (100%)**
- Real LLM Batch Evaluator: **5 / 5 Passed (100%)**
- Total: **91 / 91 Green**

---

## 15. Deployment

### Production Docker Deployment
```bash
# Launch PostgreSQL 16, FastAPI Backend, and Nginx/React Frontend
docker compose -f docker-compose.prod.yml up --build -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 16. Known Limitations

A complete analysis of production readiness declarations is documented in [LIMITATIONS.md](LIMITATIONS.md):
1. AI is strictly a copilot, not a final Quality decision authority.
2. Formal regulatory qualification (IQ/OQ/PQ) has not been performed on this demo instance.
3. OCR for scanned image-only PDFs requires enterprise cloud OCR integration.
4. Upstream Groq cloud model availability may trigger fallback execution.
5. In local environments without active PostgreSQL, SQLite is used as a development fallback.

---

## 17. Production Roadmap

1. **Enterprise Identity**: Integration with Okta / Azure AD via OAuth2/OIDC with MFA.
2. **Cloud Document Store**: AWS S3 / GCP GCS with Object Lock for immutable document retention.
3. **QMS / ERP Webhooks**: Outgoing integration with TrackWise, Veeva Vault QMS, and SAP.
4. **Dedicated Vector Database**: pgvector or Qdrant for semantic search across millions of historical deviations.
