# AIVOA Phase 8 — Human-in-the-Loop Quality Management System: Final Engineering Report

## Executive Overview

**AIVOA Phase 8** elevates the Customer Complaint Management System into a **production-grade, human-supervised Quality Management System (QMS)** conforming to global pharmaceutical standards (**21 CFR Part 211, 21 CFR Part 11, EudraLex Volume 4, and GAMP 5**).

By recognizing that **AI must never be the final Quality authority**, Phase 8 introduces:
1. **Regulated 7-Stage Complaint Lifecycle State Machine** (`DRAFT` → `SUBMITTED` → `PENDING_TRIAGE` → `UNDER_REVIEW` → `INVESTIGATION` → `QUALITY_DECISION` → `CLOSED`) with strict transition validation and HTTP 409 Conflict handling.
2. **AI Proposal Engine (`AIProposal`)**: Structured proposals (`AI_PROPOSED`) for severity, priority, and field mutations requiring explicit human adjudication.
3. **Three-Way Decision Cockpit**: `[Approve]`, `[Reject]` (mandatory documented reason), and `[Human Override]` (preserves both AI recommendation and human override values without lineage loss).
4. **Optimistic Concurrency Control (OCC)** with row-level locks (`with_for_update()`) preventing double-approval race conditions.
5. **GxP Role-Based Access Control (RBAC)** across 4 roles (`COMPLAINT_OPERATOR`, `QUALITY_REVIEWER`, `QUALITY_MANAGER`, `ADMIN`).
6. **21 CFR Part 11 Audit Trail & Visual Activity Timeline** with granular actor attribution and diff visualizations.
7. **Empirical Reviewer KPI Dashboard** computing real-time AI Override Rate (%), Acceptance Rate (%), and SLA metrics directly from PostgreSQL/SQLite records.

---

## Key Artifacts & Deliverables

### Backend Architecture
- [`backend/app/core/rbac.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/core/rbac.py): Granular RBAC definitions and `AuthorizationService.enforce()` for GxP operations.
- [`backend/app/agents/statemachine.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/agents/statemachine.py): 7-state complaint lifecycle with transition matrix validation.
- [`backend/app/models/complaint.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/models/complaint.py): `AIProposal` ORM model with `evidence`, `proposed_changes`, and `rejection_reason`.
- [`backend/app/repositories/proposal_repository.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/repositories/proposal_repository.py): Row-locked queries and dynamic reviewer dashboard metric aggregations.
- [`backend/app/services/complaint_service.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/services/complaint_service.py): Atomic proposal resolution, concurrency guard, state transition lifecycle enforcement.
- [`backend/app/api/routes/complaints.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/app/api/routes/complaints.py): `/dashboard/review`, `/{id}/proposals/{prop_id}/approve`, `/reject`, `/modify`, and `/{id}/transition` endpoints.

### Frontend Quality Reviewer Cockpit
- [`frontend/src/features/review/QualityReviewWorkspace.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/features/review/QualityReviewWorkspace.tsx): Full-width review workspace with live KPI metrics, proposal review cards, and timeline integration.
- [`frontend/src/features/review/ProposalReviewModal.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/features/review/ProposalReviewModal.tsx): Review modal comparing Current Value vs. AI Proposed Value, verbatim evidence citations, confidence scores, and three decision workflows.
- [`frontend/src/features/review/LifecycleStepper.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/features/review/LifecycleStepper.tsx): Interactive 7-step tracker for state progression.
- [`frontend/src/features/review/ComplaintActivityTimeline.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/features/review/ComplaintActivityTimeline.tsx): 21 CFR Part 11 chronological event stream with field diff chips.

### Quality Assurance & Automated Test Suites
- **Backend Test Suite**: **41 / 41 passing (100%)**
  - [`backend/tests/test_hitl_workflow.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/tests/test_hitl_workflow.py): State transitions, invalid transitions (409 Conflict), proposal approvals, rejections with mandatory justification, human overrides, double approval protection, RBAC enforcement, reviewer analytics.
  - [`backend/tests/test_e2e_hitl_demo.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/tests/test_e2e_hitl_demo.py): End-to-end integration scenario testing intake → AI proposal → human override → state transition → audit verification.
- **Frontend Test Suite**: **14 / 14 passing (100%)**
  - [`frontend/src/tests/review.test.tsx`](file:///Users/suvendusahoo/Downloads/aivo/frontend/src/tests/review.test.tsx): Proposal rendering, approval execution, rejection justification validation, human override rationale, lifecycle stepper, activity timeline.
- **Production Build**: Clean TypeScript compilation and Vite bundle (`dist/index.html`).

---

## Regulatory Compliance Verification Checklist

| Requirement | Implementation Verification | Status |
|---|---|---|
| **AI is Not Final Authority** | AI outputs only `AI_PROPOSED`; requires qualified human decision | **VERIFIED** |
| **Mandatory GxP Disclaimer** | *"AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel."* displayed across UI & API | **VERIFIED** |
| **7-Stage Lifecycle** | Explicit state machine preventing skipping (`DRAFT` → `SUBMITTED` → `PENDING_TRIAGE` → `UNDER_REVIEW` → `INVESTIGATION` → `QUALITY_DECISION` → `CLOSED`) | **VERIFIED** |
| **Invalid Transition Guard** | Returns HTTP 409 Conflict with structured error payload | **VERIFIED** |
| **Human Override Lineage** | Preserves `ai_proposed`, `human_override`, and `final` in audit delta without data loss | **VERIFIED** |
| **Concurrency OCC** | Row-level `SELECT FOR UPDATE` prevents duplicate reviewer decisions (HTTP 409) | **VERIFIED** |
| **GxP RBAC Authorization** | Role enforcement (`COMPLAINT_OPERATOR`, `QUALITY_REVIEWER`, `QUALITY_MANAGER`, `ADMIN`) returning HTTP 403 on violations | **VERIFIED** |
| **21 CFR Part 11 Audit Trail** | Immutable append-only log with ISO 8601 UTC timestamps, actors, and structured diffs | **VERIFIED** |
| **Empirical Reviewer KPIs** | Calculated dynamically from DB records: AI Override Rate, Acceptance Rate, SLAs | **VERIFIED** |

---

## 5-Minute Technical Demo Script for Evaluators

1. **Intake & Grounded Extraction**:
   - Submit: *"ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."*
   - Observe automatic extraction with verbatim text spans, field confidence, and `RiskPolicyEngine` escalation to `High` severity / `Urgent` priority.
2. **Quality Review Workspace**:
   - Switch to the **Quality Review** tab.
   - Inspect the KPI header displaying live pending proposals and real-time override rates.
   - View the 7-step **Lifecycle Stepper** at `Pending Triage`.
3. **Review AI Proposal**:
   - Click **Review Proposal** on the `Severity: High` proposal.
   - Inspect Current Value (`Medium`) vs. AI Proposed (`High`), evidence citation, and confidence score.
   - Switch to the **Human Override** tab, select `Critical`, input rationale: *"Potential batch-wide particulate contamination requires immediate quarantine and critical escalation."*
   - Click **Apply Human Override**.
4. **Lifecycle State Transition**:
   - In the Lifecycle Stepper, click **Under Review** to advance the complaint.
   - Observe real-time state machine update to `UNDER_REVIEW`.
5. **21 CFR Part 11 Audit Verification**:
   - Scroll down to the **Chronological Activity & 21 CFR Part 11 Audit Trail**.
   - Inspect the `HUMAN_OVERRIDE` badge, displaying `dr_jane_qp`, timestamp, and complete diff (`before: Medium`, `ai_proposed: High`, `human_override: Critical`).
