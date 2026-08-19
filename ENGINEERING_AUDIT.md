# AIVOA — Principal Engineering Audit & Modernization Roadmap

**System**: AIVOA Pharmaceutical Customer Complaint Management & Quality Triage System  
**Reviewer Role**: Principal Software Engineer & AI System Architect  
**Scope**: Full-Stack Architecture, LangGraph AI Orchestration, PostgreSQL Persistence, Reliability, Security, Evaluation, Observability, UX

---

## 1. Executive Summary

The AIVOA system provides a working functional prototype demonstrating LLM structured extraction, natural language edits with safe field merging, and pharmaceutical complaint intake. However, to elevate this project from an internship submission to a **FAANG-caliber, production-defensible AI product engineering portfolio**, several structural, reliability, safety, and architectural enhancements are required.

This audit evaluates the codebase across 8 dimensions and establishes a prioritized engineering execution plan (**P0 to P3**).

---

## 2. Dimensional Analysis

### 2.1 Architecture & Separation of Concerns
* **Current State**: Monolithic FastAPI router with inline business and AI pipeline invocations. DB service mixes ORM operations and sequential ID generation.
* **Technical Debt**: Lack of explicit Repository layer separates data access from domain logic. Direct router dependencies make unit testing and mocking LLMs in CI cumbersome.
* **Target Architecture**: Modular Monolith structured into:
  - `api/` (Transport, HTTP request/response validation, status codes)
  - `services/` (Domain workflows: ComplaintService, DocumentService, AIService)
  - `repositories/` (SQLAlchemy data access abstraction: ComplaintRepository, EventRepository)
  - `agents/` (LangGraph state machine, typed state, safety gates, confidence engine)
  - `middleware/` (Correlation ID `X-Request-ID`, structured JSON logging, error normalization)
  - `observability/` (Metrics aggregation, latency tracking, telemetry)

### 2.2 AI Agent Orchestration (LangGraph + Groq)
* **Current State**: LangGraph StateGraph executes sequential extraction and safe merge.
* **Gaps**:
  - Model provider is hardcoded to Groq without a formal provider interface (`LLMProvider`) that supports mock providers for deterministic unit testing and CI.
  - LLM prompt lacks explicit prompt injection defense against adversarial documents (e.g. *"Ignore previous instructions..."*).
  - Field confidence numbers were static or basic rather than grounded in actual extraction certainty and signal strength.
  - Field provenance (tracking *where* each field came from: user prompt vs. PDF document vs. manual edit) was not explicitly tracked per field.
  - Absence of an automated AI evaluation framework measuring field-level extraction precision, edit preservation invariants, and safety rejection rates.

### 2.3 Database Engineering & Relational Design
* **Current State**: SQLAlchemy models `Complaint`, `ComplaintEvent`, `ComplaintDocument` initialized via `Base.metadata.create_all()`.
* **Gaps**:
  - Lack of formal Alembic migration infrastructure.
  - Missing database indexes on high-frequency query fields (`batch_number`, `product_name`, `customer_name`, `created_at`, `status`, `severity`).
  - Missing SQL constraints (e.g. valid severity/priority checks, non-negative quantity checks).
  - Transaction atomicity: Saving complaints and corresponding audit event logs must be strictly atomic with guaranteed rollback.

### 2.4 Reliability, Observability & Error Handling
* **Current State**: Basic logging and standard HTTP exceptions.
* **Gaps**:
  - Missing standardized error model with unique machine-readable error codes (`AI_UNAVAILABLE`, `DOCUMENT_TOO_LARGE`, `VALIDATION_FAILED`) and correlation IDs.
  - Missing `X-Request-ID` propagation across HTTP headers and structured log entries.
  - Missing health probes separating `/api/health/live` (process alive) from `/api/health/ready` (database + AI ready).
  - Missing QMS Product Analytics & AI Performance telemetry dashboards.

### 2.5 Security & Data Hardening
* **Current State**: File extension checking and 10 MB size limits.
* **Gaps**:
  - Filename sanitization against path traversal (e.g. `../../sensitive.env`).
  - Document text treated as trusted rather than untrusted data in LLM prompts.
  - API rate limiting protection against accidental denial-of-service.

### 2.6 Frontend Architecture & UX
* **Current State**: React 19 + Redux Toolkit + Vite with responsive two-column layout.
* **Gaps**:
  - Lack of React Error Boundaries protecting against unexpected rendering crashes.
  - AI processing state represented with simple booleans rather than an explicit finite state machine (`IDLE` ➔ `ANALYZING` ➔ `EXTRACTING` ➔ `VALIDATING` ➔ `ASSESSING_RISK` ➔ `UPDATING_FORM` ➔ `SUCCESS` / `ERROR`).
  - Missing field-level provenance display and audit activity timeline.
  - Complaints list lacks server-side pagination and faceted filtering (`page`, `page_size`, `severity`, `status`).

---

## 3. Prioritized Modernization Roadmap

### Priority P0 — Critical Architecture & Reliability (Immediate)
1. **Refactor Backend into Clean Architectural Layers**:
   - `repositories/`: `ComplaintRepository`, `ComplaintEventRepository`, `DocumentRepository`.
   - `services/`: `ComplaintService`, `DocumentService`, `AIService`.
   - `middleware/`: Correlation ID middleware (`X-Request-ID`), structured JSON logger, error handler.
2. **Provider Abstraction (`LLMProvider`)**:
   - Create `LLMProvider` abstract base class with `GroqProvider` (production/live demo) and `MockProvider` (deterministic CI/unit testing).
3. **Database Schema Hardening & Alembic**:
   - Add database indexes on `batch_number`, `product_name`, `customer_name`, `created_at`, `status`, `severity`.
   - Setup Alembic migration baseline (`alembic.ini`, `alembic/env.py`, `versions/`).
   - Enforce atomic transaction boundaries on complaint creation and audit events.

### Priority P1 — AI Quality, Safety & Evaluation (Core Differentiators)
4. **AI Safety Gate & Prompt Injection Defense**:
   - Add prompt injection defense rules treating document content as untrusted input.
   - Enforce `SafetyGate` validation preventing unauthorized field mutation or non-QMS operations.
5. **Field Provenance & Grounded Confidence Engine**:
   - Track field-level provenance (`source: "document" | "prompt" | "user_edit"`, `source_type`, `updated_at`).
   - Implement signal-grounded confidence classification (`EXPLICIT_EXTRACTED`, `INFERRED`, `MISSING`).
6. **Automated AI Evaluation Framework**:
   - Build `evaluation/cases.json` with 10+ rigorous test cases (clean, missing fields, ambiguity, contamination, wrong strength, prompt injection, edits).
   - Create `evaluation/evaluator.py` measuring extraction accuracy, edit preservation, risk consistency, JSON validity, and safety rejection rates.
   - Output `AI_EVALUATION.md`.

### Priority P2 — Observability, Analytics & API Scalability
7. **Structured Observability & Health Probes**:
   - `GET /api/health`, `GET /api/health/live`, `GET /api/health/ready`.
   - `GET /api/analytics` (QMS complaint distribution, risk breakdown, completeness averages).
   - `GET /api/ai/metrics` (AI request count, success rate, latency p95, fallback rates).
8. **Paginated Complaint List API**:
   - `GET /api/complaints?page=1&page_size=20&search=...&severity=...&status=...`.

### Priority P3 — Frontend Polish, ADRs & FAANG Documentation
9. **Frontend Enterprise Enhancements**:
   - React `ErrorBoundary` component.
   - Explicit AI processing state machine in `aiSlice`.
   - Field provenance tags and complaint activity timeline in UI.
   - Analytics & Metrics modal for QMS directors.
10. **Architecture Decision Records (ADRs)**:
    - Create `docs/adr/` with 7 detailed ADR documents (001-007).
11. **Comprehensive Documentation Suite**:
    - Overhaul `README.md`, create `INTERVIEW_PREP.md`, and `FINAL_ENGINEERING_REPORT.md`.
