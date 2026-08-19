# AIVOA Phase 8 — Human-in-the-Loop (HITL) Quality Management Workflow

## 1. Executive Summary & GxP Compliance Philosophy

In pharmaceutical manufacturing (21 CFR Part 211 / EudraLex Volume 4 / 21 CFR Part 11), **Artificial Intelligence cannot serve as the final Quality authority**. 

AIVOA adheres to the strict regulatory boundary:
> **"AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel."**

AI serves as an intelligent copilot that:
- Ingests unstructured complaints across multi-modal formats (text, PDF, DOCX, TXT, EML)
- Normalizes and validates input data against pharma domain constraints
- Performs grounded evidence extraction with verbatim text spans and page numbers
- Calculates automated risk classification (Severity & Priority) via deterministic `RiskPolicyEngine`
- Computes regulatory completeness scores and identifies missing critical parameters
- Formulates structured **AI Proposals (`AI_PROPOSED`)** for human review

**The Human Quality Authority (Qualified Person / QA Reviewer)**:
- Inspects proposed classifications alongside grounded source evidence citations
- Approves (`APPROVED` → `APPLIED`), rejects (`REJECTED` with mandatory justification), or overrides (`MODIFIED` / `HUMAN_OVERRIDE` with rationale)
- Advances complaints across the regulated 7-stage lifecycle state machine
- Ensures complete, non-repudiable 21 CFR Part 11 auditability

---

## 2. Regulated 7-Stage Complaint Lifecycle State Machine

AIVOA enforces an explicit finite state machine (`ComplaintStateMachine`) preventing illegal transitions:

```
           ┌──────────┐
           │  DRAFT   │
           └────┬─────┘
                │
                ▼
         ┌──────────────┐
         │  SUBMITTED   │
         └──────┬───────┘
                │
                ▼
       ┌──────────────────┐
       │  PENDING_TRIAGE  │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │   UNDER_REVIEW   │ ◄─────────────────────────┐
       └────────┬─────────┘                           │
                │                                     │ (Re-open)
                ▼                                     │
       ┌──────────────────┐                           │
       │  INVESTIGATION   │                           │
       └────────┬─────────┘                           │
                │                                     │
                ▼                                     │
     ┌──────────────────────┐                         │
     │   QUALITY_DECISION   │                         │
     └──────────┬───────────┘                         │
                │                                     │
                ▼                                     │
           ┌──────────┐                               │
           │  CLOSED  │ ──────────────────────────────┘
           └──────────┘
```

### Transition Validation Rules

| Current State | Allowed Next States | Enforced Permissions | Error on Invalid Attempt |
|---|---|---|---|
| `DRAFT` | `SUBMITTED`, `PENDING_TRIAGE` | `CREATE_COMPLAINT`, `EDIT_COMPLAINT` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |
| `SUBMITTED` | `PENDING_TRIAGE`, `UNDER_REVIEW`, `DRAFT` | `CHANGE_STATUS` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |
| `PENDING_TRIAGE` | `UNDER_REVIEW`, `INVESTIGATION`, `DRAFT` | `CHANGE_STATUS` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |
| `UNDER_REVIEW` | `INVESTIGATION`, `QUALITY_DECISION`, `CLOSED` | `CHANGE_STATUS`, `CLOSE_COMPLAINT` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |
| `INVESTIGATION` | `QUALITY_DECISION`, `UNDER_REVIEW` | `CHANGE_STATUS` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |
| `QUALITY_DECISION`| `CLOSED`, `INVESTIGATION`, `UNDER_REVIEW`| `CLOSE_COMPLAINT`, `CHANGE_STATUS` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |
| `CLOSED` | `UNDER_REVIEW` *(Reopen only)* | `CLOSE_COMPLAINT`, `ADMIN` | HTTP 409 Conflict (`INVALID_STATE_TRANSITION`) |

---

## 3. AI Proposal Lifecycle & Human Decision Matrix

When AI detects a potential mutation to a complaint (such as recommending an escalation to `High` severity or `Urgent` priority), it creates an `AIProposal` record in the database:

```
[ AI Risk Engine / Copilot ]
           │
           ▼ Creates
   [ AI_PROPOSED ]  (proposal_id: PROP-101-AI93D22C-01)
           │
 ┌─────────┼────────────────────────┐
 │         │                        │
 ▼         ▼                        ▼
[ APPROVE ] [ REJECT ]            [ HUMAN OVERRIDE ]
 │         │                        │
 │         ▼                        ▼
 │   [ REJECTED ]              [ MODIFIED ]
 │   - Mandatory reason saved  - Preserves AI & Human values
 │   - Value retained          - Applies human value to record
 │                             - Emits HUMAN_OVERRIDE audit event
 ▼
[ APPLIED ]
- Applies proposed value
- Emits USER_APPROVED & CHANGE_APPLIED audit events
```

### Preserving Full Lineage on Human Override
When a reviewer overrides an AI proposal (e.g. AI proposed `High`, Reviewer sets `Critical`):
- `AIProposal.current_value`: `"Medium"`
- `AIProposal.proposed_value`: `"High"`
- `AIProposal.reviewer_decision`: `"Critical"`
- `AIProposal.status`: `"MODIFIED"`
- Audit Event Diff:
```json
{
  "severity": {
    "before": "Medium",
    "ai_proposed": "High",
    "human_override": "Critical",
    "final": "Critical"
  }
}
```
**No AI lineage is ever erased or overwritten.**

---

## 4. Concurrency Control & Double-Approval Protection

To prevent race conditions when multiple QA reviewers work concurrently:
1. **Row-Level Locking**: `SELECT FOR UPDATE` (`with_for_update()`) on `ai_proposals`.
2. **State Guard**: If the proposal status is already `APPROVED`, `APPLIED`, `REJECTED`, or `MODIFIED`, the second request immediately fails with:
```json
{
  "error": {
    "code": "PROPOSAL_ALREADY_REVIEWED",
    "message": "Proposal 'PROP-2026-01' has already been reviewed (Current status: APPLIED).",
    "reviewed_by": "qa_reviewer_01",
    "reviewed_at": "2026-08-17T22:30:00Z"
  }
}
```

---

## 5. Role-Based Access Control (RBAC)

AIVOA enforces GxP authorization across four granular roles:

| Role | Description | Key Permissions |
|---|---|---|
| `COMPLAINT_OPERATOR` | Frontline customer support / intake staff | `CREATE_COMPLAINT`, `EDIT_COMPLAINT`, `VIEW_AUDIT` |
| `QUALITY_REVIEWER` | Qualified QA Specialist reviewing AI proposals | `REVIEW_AI_PROPOSAL`, `CHANGE_SEVERITY`, `CHANGE_PRIORITY`, `CHANGE_STATUS` |
| `QUALITY_MANAGER` | QA Lead / Qualified Person (QP) | All Reviewer permissions + `CLOSE_COMPLAINT` |
| `ADMIN` | System administrator | Full administrative and audit privileges |

---

## 6. Reviewer Cockpit KPI Dashboard

The Quality Review Workspace dynamically computes live operational metrics from real database records (no fake/mock data):
- **Pending AI Reviews**: Active proposals awaiting human decision
- **AI Override Rate (%)**: `(human_overrides / total_decisions) * 100`
- **AI Acceptance Rate (%)**: `(approved_proposals / total_decisions) * 100`
- **High/Critical Queue**: Count of active high-severity complaint records
- **Average Review SLA**: Computed review turnaround latency in seconds

---

## 7. 21 CFR Part 11 Immutable Audit Trail

Every state change, proposal creation, reviewer approval, human override, and document extraction creates an immutable entry in the `complaint_events` table:
- **Timestamp**: ISO 8601 UTC
- **Actor & Actor Type**: `[AI Copilot]` / `[Quality Reviewer]` / `[System Engine]`
- **Event Type**: `COMPLAINT_CREATED`, `AI_PROPOSAL_CREATED`, `USER_APPROVED`, `USER_REJECTED`, `HUMAN_OVERRIDE`, `CHANGE_APPLIED`, `STATE_TRANSITION`
- **Field Diff**: Exact before/after JSON delta
- **AI Run Telemetry**: Execution run ID, token count, latency
