# AIVOA — Pharmaceutical Customer Complaint Management System

[![Backend Tests](https://img.shields.io/badge/pytest-76%2F76%20passed-brightgreen)](backend/tests/)
[![Frontend Tests](https://img.shields.io/badge/vitest-14%2F14%20passed-brightgreen)](frontend/src/tests/)
[![Oxlint](https://img.shields.io/badge/oxlint-0%20warnings%20%7C%200%20errors-brightgreen)](frontend/)
[![Compliance](https://img.shields.io/badge/compliance-21%20CFR%20Part%2011%20%7C%20ICH%20Q9-blue)](backend/app/services/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**AIVOA** is an AI-assisted customer complaint management system engineered for pharmaceutical Quality Assurance (QA) and Qualified Person (QP) operations under **21 CFR Part 11**, **EU GMP Annex 11**, and **ICH Q9 (Quality Risk Management)** regulations.

---

## Key Capabilities

- **AI Complaint Extraction & Entity Resolution**: Extracts structured complaint records from unstructured text, emails, and phone logs into validated schemas.
- **Evidence-Grounded AI & Provenance**: Every extracted field maintains verbatim source text span attribution, document ID, page numbers, and confidence scoring.
- **Natural-Language Dynamic Editing**: Allows Quality Reviewers to refine existing records via conversational instructions while preserving unaffected fields.
- **Multi-Format Document Ingestion**: Parses batch release certificates, investigation reports, and customer letters across `.pdf`, `.docx`, `.txt`, and `.csv`.
- **ICH Q9 Risk Assessment Engine**: Automatically classifies defect severity (`Critical`, `High`, `Medium`, `Low`) and investigation priority based on deterministic risk policy matrices.
- **Human-in-the-Loop (HITL) Review Cockpit**: Quality Reviewers can approve, override, or reject AI proposals with mandatory regulatory justifications.
- **21 CFR Part 11 Immutable Audit Trail**: Cryptographically chained sequence of audit events capturing full payload diffs, operator identities, and timestamps.
- **Optimistic Concurrency Control**: Prevents race conditions and double-approvals via entity version locking (`HTTP 409 Conflict`).
- **Security & Prompt Injection Defenses**: Deterministic safety gates sanitize inputs, normalize enums, and block prompt injection attempts.

---

## System Architecture

```
aivo/
├── backend/                  # FastAPI + LangGraph Backend
│   ├── app/
│   │   ├── api/              # REST Endpoints (Complaints, Reviews, Telemetry, Demo)
│   │   ├── core/             # Configuration, Security, Logging, Feature Flags
│   │   ├── db/               # SQLAlchemy Models, Session, SQLite/PostgreSQL
│   │   ├── graph/            # LangGraph Workflow Orchestration & State
│   │   ├── models/           # Pydantic Schemas (Complaint, Proposal, Risk, Event)
│   │   ├── repositories/     # Data Access Layer & Concurrency Locks
│   │   ├── routers/          # API Route Aggregation
│   │   └── services/         # Business Logic, NLP Extraction, HITL Service
│   └── tests/                # 76 Unit, Integration, Concurrency & Security Tests
├── frontend/                 # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/       # Shell Navigation (Sidebar, TopBar, CommandBar)
│   │   ├── design/           # Tokens & Inter Variable Typography Engine
│   │   ├── features/         # Workspaces (Overview, Intake, Review, Analytics, Timeline)
│   │   ├── services/         # Typed API Client
│   │   ├── store/            # Redux Toolkit Slices
│   │   └── types/            # TypeScript Interfaces
│   └── index.html
└── scripts/
    └── prepare_demo.sh       # Deterministic Demo Preparation & Database Seeder
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Groq API Key (or fallback simulation)

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start FastAPI development server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Server: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Probe: `http://127.0.0.1:8000/api/health`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

- Web Client: `http://127.0.0.1:5173`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open Global Command Bar / Quick Jump |
| `N` | Jump to New Complaint Intake |
| `R` | Open Quality Review Queue |
| `O` | Open Operational Overview Dashboard |
| `Escape` | Close Active Modal / Popover |

---

## Testing & Quality Assurance

### Backend Test Suite (76 Tests)
```bash
backend/.venv/bin/pytest backend/tests/ -v
```
- Covers state transitions, RBAC matrix, optimistic concurrency, prompt injection defense, document ingestion, and real AI integration smoke.

### Frontend Test Suite (14 Tests)
```bash
cd frontend
npm test -- --run
```

### Frontend Linting & Production Build
```bash
cd frontend
npm run lint      # Oxlint: 0 warnings, 0 errors
npm run build     # Production bundle compilation
```

---

## Pre-Seeded GxP Demo Scenarios

The system includes 3 deterministic demonstration scenarios accessible via the top-bar dropdown:

1. **Scenario A — Foreign Particulate (Paracetamol API)**:
   - *Issue*: Visible black particles in Paracetamol API 99.5%, Batch PA240812.
   - *Classification*: Foreign Matter / Critical Severity.
2. **Scenario B — Packaging Defect (Amoxicillin 500mg)**:
   - *Issue*: Compromised tamper-evident seals on Amoxicillin Trihydrate 500mg, Batch AMX-2026-884.
   - *Classification*: Packaging Defect / High Severity.
3. **Scenario C — Out of Specification (Ibuprofen DC)**:
   - *Issue*: Assay potency failure of 72.4% on Ibuprofen DC Granules, Batch IBU-DC-9011.
   - *Classification*: Out of Specification / Critical Severity.

---

## License

This project is licensed under the MIT License.
