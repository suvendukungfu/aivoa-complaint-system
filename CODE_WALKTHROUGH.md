# AIVOA — End-to-End Code Walkthrough & Architectural Trace

This document maps the exact file-by-file code execution path across backend services, agentic workflows, database persistence, and frontend React components.

---

## 🗺️ Architectural Flow Diagram

```
[ User Action / Document Upload ]
               │
               ▼
[ React 19 Frontend ] (QualityReviewWorkspace.tsx, ComplaintForm.tsx)
               │ HTTP POST /api/v1/complaints/log (with X-Request-ID, Idempotency-Key)
               ▼
[ Middleware Pipeline ] (RequestIDMiddleware ➔ LoggingMiddleware ➔ IdempotencyMiddleware)
               │
               ▼
[ FastAPI Routes ] (backend/app/api/routes/complaints.py)
               │
               ▼
[ AIService ] (backend/app/services/ai_service.py)
               │
               ▼
[ LangGraph StateGraph ] (backend/app/agents/graph.py)
  ├── SafetyGate Node (backend/app/agents/safety.py)
  ├── GroqProvider / LLM Node (backend/app/agents/providers.py)
  ├── Fallback Rule Engine (backend/app/agents/nodes.py)
  ├── RiskPolicyEngine (backend/app/agents/policy.py)
  └── FieldProvenanceEngine (backend/app/agents/provenance.py)
               │
               ▼
[ ComplaintService ] (backend/app/services/complaint_service.py)
  ├── AuthorizationService (backend/app/core/rbac.py)
  ├── ComplaintStateMachine (backend/app/agents/statemachine.py)
  └── Row Locking & OCC (backend/app/repositories/proposal_repository.py)
               │
               ▼
[ Relational Persistence ] (PostgreSQL 16 / SQLAlchemy Models in backend/app/models/)
  ├── Complaint (Record state, lifecycle status, completeness score)
  ├── AIProposal (AI-generated recommendations awaiting review)
  └── ComplaintEvent (Immutable 21 CFR Part 11 audit log)
```

---

## 🔍 Request Path Trace: Complaint Intake & Extraction

### 1. Ingestion Endpoint
- **File**: `backend/app/api/routes/complaints.py`
- **Function**: `log_complaint_from_text(payload: ComplaintLogRequest, db: Session = Depends(get_db))`
- **Trace**:
  1. Captures `X-Request-ID` from request state.
  2. Dispatches raw text to `AIService.process_complaint_text(text, source="customer_prompt")`.

### 2. Agentic Workflow Execution
- **File**: `backend/app/agents/graph.py` & `backend/app/agents/nodes.py`
- **Trace**:
  1. `safety_gate_node`: Scans prompt for jailbreak and injection patterns.
  2. `extraction_node`: Formats structured system prompt and calls `GroqProvider.invoke_with_telemetry()`.
     - Multi-model fallback requests `gemma2-9b-it`, automatically falls over to active models (`openai/gpt-oss-20b`), and accurately logs telemetry.
     - Deterministic rule backfill ensures critical fields (customer, batch, product) are never lost.
  3. `risk_assessment_node`: Evaluates `RiskPolicyEngine` rules (e.g. USP <788> foreign matter $\rightarrow$ High severity floor).
  4. `provenance_node`: Generates `FieldProvenance` objects with exact text spans, confidence ratings, and source tags.

### 3. Persistence & Proposal Generation
- **File**: `backend/app/services/complaint_service.py`
- **Function**: `save_or_create_complaint(complaint_data)`
- **Trace**:
  1. Generates unique complaint code: `CMP-2026-XXXX`.
  2. Persists `Complaint` entity.
  3. Records immutable creation event in `ComplaintEvent`.
  4. If AI suggested high-risk severity or priority upgrades, generates `AIProposal` records with status `AI_PROPOSED`.

---

## 🔍 Request Path Trace: Quality Review & Human Override

### 1. Review Decision Endpoint
- **File**: `backend/app/api/routes/complaints.py`
- **Function**: `modify_proposal(complaint_id, proposal_id, req: ProposalModifyRequest, db: Session)`
- **Trace**:
  1. Validates RBAC permissions: `AuthorizationService.enforce(Role.QUALITY_REVIEWER, Permission.REVIEW_AI_PROPOSAL)`.
  2. Calls `ComplaintService.modify_ai_proposal()`.

### 2. Concurrency Lock & Proposal Application
- **File**: `backend/app/services/complaint_service.py`
- **Function**: `modify_ai_proposal(proposal_id_str, human_value, reason, reviewer_id, reviewer_role)`
- **Trace**:
  1. Acquires row-level lock using `proposal_repo.get_by_code_for_update(proposal_id_str)`.
  2. Checks proposal status: if not `AI_PROPOSED`, raises `HTTP 409 Conflict` (`PROPOSAL_ALREADY_REVIEWED`).
  3. Updates proposal status to `MODIFIED` with `human_value` and reviewer ID.
  4. Mutates the complaint's active field (e.g. `severity = "Critical"`).
  5. Emits immutable 21 CFR Part 11 audit event containing 4-way delta:
     ```json
     {
       "event_type": "PROPOSAL_MODIFIED",
       "actor_type": "HUMAN_QUALITY_REVIEWER",
       "diffs": {
         "severity": {
           "before": "Medium",
           "ai_proposed": "High",
           "human_override": "Critical",
           "final": "Critical"
         }
       }
     }
     ```

---

## 🔍 Request Path Trace: Evidence Grounding & Document Viewer

### 1. Extraction with Span Grounding
- **File**: `backend/app/agents/provenance.py`
- **Function**: `FieldProvenanceEngine.generate_provenance(extracted_fields, raw_text, source_type, doc_id)`
- **Trace**:
  1. Finds exact character offsets `[start_idx, end_idx]` in source text.
  2. For plain text and DOCX files without page boundaries, sets `page_number = null` to prevent hallucinated pagination.
  3. For derived / calculated fields, sets `classification = "INFERRED"`, `text_span = null`, and `source_type = "ai_inference"`.

### 2. Frontend Evidence Popover & Highlighting
- **File**: `frontend/src/features/review/EvidencePopover.tsx` & `DocumentEvidenceViewer.tsx`
- **Trace**:
  1. Displays badge indicating extraction classification (`EXPLICIT_EXTRACTED`, `INFERRED`, `USER_SPECIFIED`).
  2. Shows verbatim quote with jump link.
  3. Clicking quote scrolls the document viewer to the exact grounded location and applies a glowing yellow highlight.
