# AIVOA Phase 8 — Human-in-the-Loop QMS Architecture Audit

**Author**: Staff AI Product & Systems Reliability Architect  
**Date**: August 18, 2026  
**Status**: Comprehensive Baseline Audit Completed  
**Target Architecture**: Human-Supervised AI-Assisted Pharmaceutical Complaint Quality Management System (GxP / 21 CFR Part 11 Alignment)

---

## 1. Executive Summary

This document provides a systematic audit of the existing `aivoa-complaint-system` codebase across data models, schemas, domain services, repositories, LangGraph agent workflows, API contracts, frontend state management, and regulatory compliance invariants.

The system currently achieves state-of-the-art AI-assisted complaint intake, document extraction, evidence grounding, deterministic risk policy evaluations, and basic proposal records. This audit establishes the architectural blueprint required to elevate the system into a **fully governed, concurrency-safe, role-authorized, human-in-the-loop (HITL) Quality Management System (QMS)** where AI acts strictly in an advisory capacity.

---

## 2. Current State vs. Target State Gap Analysis

```
┌────────────────────────────────────────────────────────┐
│              CURRENT STATE (Phase 7 Baseline)          │
│ • Intake & copilot natural-language extraction         │
│ • Verbatim text span grounding & page citations        │
│ • Initial AIProposal database model & approve/reject   │
│ • Basic state transition endpoints                     │
└───────────────────────────┬────────────────────────────┘
                            │
            [Phase 8 Architectural Evolution]
                            │
┌───────────────────────────▼────────────────────────────┐
│              TARGET STATE (Phase 8 Production QMS)     │
│ • Strict 7-Stage State Machine with 409 Conflict gates │
│ • High-Impact Field Policy (severity, priority, batch) │
│ • Atomic DB transactions with optimistic locking (OCC) │
│ • Role-Based Access Control (RBAC) Abstraction Layer   │
│ • Idempotent proposal approvals (Idempotency-Key)      │
│ • Dedicated Reviewer Cockpit & ProposalReviewModal     │
│ • Real-time AI Override Rate & Review SLA Analytics   │
│ • Immutable 21 CFR Part 11 Event Ledger with Diff Logs │
└────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Audit

### 3.1 Data Models (`backend/app/models/complaint.py`)
* **Current Status**:
  * `Complaint`: Contains structured fields, GxP status, severity, priority, provenance JSON, and relationships (`events`, `documents`, `ai_runs`, `proposals`).
  * `AIProposal`: Contains `proposal_id`, `complaint_id`, `field_name`, `current_value`, `proposed_value`, `status` (`AI_PROPOSED`, `APPROVED`, `REJECTED`, `MODIFIED`), and review audit fields.
  * `ComplaintEvent`: Immutable audit log table recording `event_type`, `diffs`, `actor`, `actor_type`, and `ai_run_id`.
* **Identified Gaps**:
  * `AIProposal` status values need standardized enum support (`PROPOSED`, `APPROVED`, `REJECTED`, `APPLIED`) alongside legacy aliases.
  * `AIProposal` requires explicit `evidence` string and structured `proposed_changes` JSON column for multi-field change payloads.
  * Need concurrency versioning column / locking on `AIProposal` to prevent double approval race conditions.

### 3.2 State Machine & Transition Validation (`backend/app/agents/statemachine.py`)
* **Current Status**:
  * `ComplaintStateMachine` defines 7 lifecycle stages:
    $$\text{DRAFT} \longrightarrow \text{SUBMITTED} \longrightarrow \text{PENDING\_TRIAGE} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{INVESTIGATION} \longrightarrow \text{QUALITY\_DECISION} \longrightarrow \text{CLOSED}$$
* **Identified Gaps**:
  * API routes must return HTTP `409 Conflict` with structured error JSON `{ "error": { "code": "INVALID_STATE_TRANSITION", "message": "..." } }` instead of generic `400 Bad Request`.
  * AI actor guardrail must prevent AI from transitioning records to formal review/investigation/closed states without human authorization.

### 3.3 Authorization & Access Control
* **Current Status**:
  * Basic actor strings (`"qa_reviewer"`, `"aivoa_copilot"`).
* **Identified Gaps**:
  * Lack of a formalized Role-Based Access Control (RBAC) abstraction layer.
  * Need `Role` enum (`COMPLAINT_OPERATOR`, `QUALITY_REVIEWER`, `QUALITY_MANAGER`, `ADMIN`) and `Permission` enum (`CREATE_COMPLAINT`, `EDIT_COMPLAINT`, `REVIEW_AI_PROPOSAL`, `CHANGE_SEVERITY`, `CHANGE_PRIORITY`, `CHANGE_STATUS`, `CLOSE_COMPLAINT`, `VIEW_AUDIT`).
  * Backend enforcement must reject unauthorized operations at the service and route layer.

### 3.4 Concurrency Control & Idempotency
* **Current Status**:
  * Idempotency middleware exists for general API calls.
* **Identified Gaps**:
  * Review decision endpoints (`/approve`, `/reject`, `/modify`) require row-level locking (`SELECT ... FOR UPDATE` in PostgreSQL / atomic status validation in SQLite) to prevent two reviewers approving the same proposal simultaneously.
  * Second approval attempt must fail safely with HTTP `409 Conflict` ("Proposal has already been reviewed").

### 3.5 Human Override & Feedback Analytics
* **Current Status**:
  * Service stores `ai_recommendation` and `human_decision` in event diffs.
* **Identified Gaps**:
  * Need dedicated calculation of **AI Override Rate** ($\frac{\text{Overrides}}{\text{Total Decisions}} \times 100\%$) and **Average Review Time** derived dynamically from database events.
  * Expose reviewer dashboard endpoint providing pending review counts, override ratios, and SLA timings.

### 3.6 Frontend Reviewer Experience
* **Current Status**:
  * Basic `QualityReviewWorkspace.tsx` and `AuditTimeline.tsx`.
* **Identified Gaps**:
  * Need specialized `ProposalReviewModal.tsx` for granular comparison of Old Value vs. AI Proposed Value vs. Verbatim Evidence Quote.
  * Need `LifecycleStepper.tsx` visually reflecting backend-validated state progression.
  * Need `ComplaintActivityTimeline.tsx` with clear `[AI]`, `[USER]`, and `[SYSTEM]` actor differentiation.

---

## 4. Architectural Invariant Matrix

| Regulatory / Engineering Requirement | System Invariant Enforcement |
| :--- | :--- |
| **Human Authority Principle** | AI is strictly advisory. AI cannot independently approve, close, or mutate high-impact fields (`severity`, `priority`, `product_name`, `batch_number`, `complaint_type`). |
| **No Overwriting AI Recommendations** | When a human reviewer overrides an AI proposal (e.g. `High` $\rightarrow$ `Critical`), the database preserves `ai_value`, `human_value`, and `final_value`. |
| **Atomic Transactions** | Approvals update complaint, update proposal, and emit audit ledger events in a single atomic transaction; any failure triggers total rollback. |
| **Concurrency Safety** | Row locking / status checking blocks race conditions on concurrent proposal decisions. |
| **Anti-Fabrication Guarantee** | Inferred fields receive `text_span: null`. Page numbers appear only when verified from source document structure. |

---

## 5. Recommended Implementation Plan

1. **Step 1 — RBAC & Authorization Layer**:
   Create [`backend/app/core/rbac.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/core/rbac.py) with roles, permissions, and validation helpers.
2. **Step 2 — Database Model & Schema Hardening**:
   Update `AIProposal` model and Alembic migration for concurrency versioning, `evidence`, and `proposed_changes`.
3. **Step 3 — Concurrency-Safe Complaint Service**:
   Upgrade `ComplaintService` with atomic `FOR UPDATE` proposal decisions, state transition conflict handling (`409 Conflict`), and analytics calculations.
4. **Step 4 — API v1 Review & Lifecycle Endpoints**:
   Implement standard REST routes `/api/v1/complaints/{id}/proposals/{id}/approve`, `/reject`, `/modify`, `/transition`, `/dashboard`.
5. **Step 5 — Frontend Components**:
   Implement `ProposalReviewModal.tsx`, `LifecycleStepper.tsx`, and `ComplaintActivityTimeline.tsx`.
6. **Step 6 — Comprehensive Test Suite & E2E Verification**:
   Add concurrency, authorization, override, and state machine tests.
7. **Step 7 — Technical Documentation & Deliverables**:
   Generate `docs/HUMAN_IN_THE_LOOP.md`, update `INTERVIEW_PREP.md`, and `PHASE8_FINAL_REPORT.md`.
