# AIVOA Final Code Walkthrough & Architecture Map

**Audience**: Senior / Staff / Principal Engineers inspecting repository structure  
**Codebase**: AIVOA Pharmaceutical Complaint Management System  

---

## 1. End-to-End Execution Flow

```
[FRONTEND LAYER]
CopilotPanel.tsx / DocumentUpload.tsx / ReviewWorkspace.tsx
       ↓ (Dispatches async thunk)
api.ts (Axios HTTP client with idempotency keys)
       ↓ (Updates global state)
Redux Store (complaintSlice.ts, aiSlice.ts)

       ↓ [HTTP POST /api/v1/complaints/log]

[BACKEND INGRESS & SERVICE LAYER]
backend/app/api/v1/endpoints/complaints.py (Pydantic validation, RBAC)
       ↓
backend/app/services/complaint_service.py & ai_service.py
       ↓
[LANGGRAPH WORKFLOW ENGINE]
backend/app/agents/graph.py (Compiled StateGraph)
       ↓
backend/app/agents/nodes.py (7 Sequential Functional Nodes):
  1. normalize_input_node (Prompt injection scanning)
  2. extract_data_node (GroqProvider inference)
  3. validate_fields_node (QMS schema data dictionary validation)
  4. calculate_completeness_node (QMS completeness scoring)
  5. assess_risk_node (RiskPolicyEngine deterministic floor evaluation)
  6. detect_duplicates_node (Historical lot & product similarity matching)
  7. format_response_node (Redux-ready payload packaging)

       ↓ [SAFETY & EVIDENCE SUB-SYSTEMS]
backend/app/agents/safety.py (SafetyGate output sanitization)
backend/app/utils/provenance.py (Verbatim text span extraction & grounding)
backend/app/agents/policy.py (RiskPolicyEngine deterministic safety rules)

       ↓ [HUMAN-IN-THE-LOOP & PERSISTENCE]
backend/app/repositories/proposal_repository.py (AIProposal staging)
backend/app/agents/lifecycle.py (ComplaintStateMachine state transitions)
backend/app/repositories/audit_repository.py (Immutable AuditEvent logging)
backend/app/repositories/complaint_repository.py (Atomic sequence numbers)
       ↓
PostgreSQL / SQLite Database
```

---

## 2. Component Responsibility Matrix

| Component / File | Layer | Primary Responsibility |
|---|---|---|
| [`frontend/src/components/CopilotPanel.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/components/CopilotPanel.tsx) | UI Ingress | Natural language prompt submission, scenario buttons, command palette. |
| [`frontend/src/components/ReviewWorkspace.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/components/ReviewWorkspace.tsx) | UI HITL | Quality Reviewer dashboard, AI proposal approval/rejection/modification modal. |
| [`frontend/src/components/EvidenceViewer.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/components/EvidenceViewer.tsx) | UI Grounding | Verbatim text span document viewer with page and confidence badges. |
| [`frontend/src/store/complaintSlice.ts`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/store/complaintSlice.ts) | State | Redux state for 16 complaint fields, provenance maps, and validation status. |
| [`backend/app/api/v1/endpoints/complaints.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/api/v1/endpoints/complaints.py) | API Ingress | REST endpoints for intake, edits, transitions, proposals, and dashboard analytics. |
| [`backend/app/services/complaint_service.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/services/complaint_service.py) | Service | Atomic complaint persistence, sequence number assignment, audit event generation. |
| [`backend/app/agents/graph.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/graph.py) | AI Engine | LangGraph StateGraph topology, conditional routing, compile phase. |
| [`backend/app/agents/nodes.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/nodes.py) | AI Engine | Core business logic executing LLM prompts, fallback backfills, and audit logging. |
| [`backend/app/agents/providers.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/providers.py) | AI Engine | `GroqProvider` with primary `gemma2-9b-it` target, multi-model failover, and telemetry. |
| [`backend/app/agents/safety.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/safety.py) | Security | `SafetyGate` stripping injection tokens and coercing invalid enums to valid bounds. |
| [`backend/app/utils/provenance.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/utils/provenance.py) | AI Reliability | Extracts exact character offsets and text spans from source text; flags inferred fields. |
| [`backend/app/agents/policy.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/policy.py) | QMS Quality | `RiskPolicyEngine` enforcing deterministic regulatory safety floors (e.g. particulate matter = High). |
| [`backend/app/agents/lifecycle.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/lifecycle.py) | QMS Quality | `ComplaintStateMachine` validating unidirectional complaint lifecycle transitions. |
| [`backend/app/repositories/proposal_repository.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/repositories/proposal_repository.py) | HITL | CRUD and concurrency control for `AIProposal` models. |
| [`backend/app/repositories/audit_repository.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/repositories/audit_repository.py) | Compliance | Append-only immutable `AuditEvent` ledger inspired by 21 CFR Part 11 principles. |

---

## 3. Detailed Subsystem Analysis

### A. Extraction & Safety Gate
1. User prompt enters `extract_data_node` in `nodes.py`.
2. `GroqProvider.invoke_with_telemetry` issues prompt to Groq API.
3. Raw JSON response is cleaned by `extract_json_from_llm_response()` (strips markdown fences and reasoning `<think>` tags).
4. `SafetyGate.validate_extracted_payload()` filters against allowed QMS field keys and normalizes enum fields.
5. If Groq is unavailable, `fallback_deterministic_extractor()` safely parses standard pharmaceutical entities using regex and keyword heuristics.

### B. Evidence Grounding & Non-Fabrication
1. `ProvenanceTracker.build_provenance_map()` in `provenance.py` scans source document text for each extracted value.
2. For explicit matches, exact character spans, page numbers (if PDF), and confidence are recorded.
3. For inferred values (e.g. triage severity), `classification="INFERRED"` is assigned with `text_span=None`, strictly preventing hallucinated evidence links.

### C. Human-in-the-Loop AI Proposals
1. When AI recommends a risk escalation or critical parameter change, an `AIProposal` record is staged in status `AI_PROPOSED`.
2. In `ReviewWorkspace.tsx`, reviewers can accept (`APPROVE`), reject (`REJECT`), or modify (`MODIFY`).
3. Modifying a proposal requires a mandatory GxP justification string, updating the record to `MODIFIED` and recording a `HUMAN_OVERRIDE` event in the audit trail.

### D. Immutable Audit Ledger
1. Every state mutation calls `AuditEventRepository.log_event()`.
2. Diffs are captured as `{field: {old: v1, new: v2}}`.
3. Records contain immutable UUIDs, UTC timestamps, actor identifiers, and roles.
