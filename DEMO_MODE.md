# AIVOA — 10-Minute Quality Review & Technical Demo Guide

This document provides a step-by-step script to deliver a flawless, high-impact 10-minute technical demonstration of the **AIVOA Pharmaceutical Customer Complaint Management System**.

---

## ⏱️ Demo Timeline Overview

| Timestamp | Phase / Section | Focus / Key Feature Demonstrated |
|---|---|---|
| **00:00 – 01:30** | **System Overview & Architecture** | React 19 UI, LangGraph StateGraph, Groq, PostgreSQL, GxP alignment |
| **01:30 – 03:30** | **Natural-Language Complaint Intake** | Ingestion of raw unstructured complaint, multi-field extraction, SafetyGate |
| **03:30 – 05:00** | **Evidence Grounding & Provenance** | Hovering extracted fields, verbatim text spans, document viewer jump |
| **05:00 – 07:00** | **Human-in-the-Loop Review Cockpit** | Reviewer dashboard, AI proposals, [Approve], [Reject], [Human Override] |
| **07:00 – 08:30** | **7-Stage Lifecycle & Concurrency** | State stepper, OCC race condition protection (409 Conflict), RBAC |
| **08:30 – 10:00** | **21 CFR Part 11 Audit Trail & Telemetry** | Immutable event logs, AI run telemetry, requested vs actual model, Q&A |

---

## 📋 Step-by-Step Execution Script

### 1. Setup & Clean State (00:00)
1. Ensure servers are running:
   ```bash
   make dev
   ```
2. Reset demo data via single command:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/v1/demo/reset
   ```
3. Open browser at `http://localhost:5173`.

---

### 2. Natural Language Intake & Real AI Extraction (01:30)
1. In the **Intake Form**, paste the canonical pharmaceutical complaint prompt:
   > *"ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."*
2. Click **Process Complaint with AI**.
3. **What to highlight**:
   - Extraction of Customer Name (`ABC Pharma`), Product (`Paracetamol API 99.5%`), Batch Number (`PA240812`), Dates, and Quantity (`25 kg`).
   - Notice the **AI Completeness Score** (95%+) and Risk Evaluation.
   - Point out that foreign matter automatically triggered an elevated Severity floor (`High`/`Critical`).

---

### 3. Evidence Grounding & Document Provenance (03:30)
1. Hover over the **Batch Number** field badge or click the **AI Extracted** badge.
2. Observe the popover showing:
   - **Source**: `Customer prompt`
   - **Verbatim Text Span**: `"batch PA240812"`
   - **Confidence**: `98%`
   - **AI Run ID**: `AI-XXXXXX`
3. Click the **Document / Evidence Viewer** drawer:
   - Point out the yellow verbatim text highlight.
   - Explain how inferred fields (like *Severity*) strictly declare `Source: AI Inference` with `text_span: null` to avoid hallucinated evidence.

---

### 4. Quality Review Workspace & AI Proposals (05:00)
1. Switch to the **Quality Review** tab in the top navigation bar.
2. Highlight the **Live KPI Cockpit**:
   - Total Proposals
   - Pending AI Reviews
   - AI Acceptance Rate % vs Human Override Rate % (computed directly from database records).
3. Open a pending proposal (e.g. *Severity Upgrade: Medium $\rightarrow$ High*):
   - Click **Review Proposal** modal.
   - Demonstrate the side-by-side comparison: **Current Value** vs **AI Proposed Value**.
   - Show the **AI Evidence Justification**: *"Visible foreign particulate matter in active pharmaceutical ingredient represents patient safety risk."*
4. Click **[Human Override]**:
   - Change value to **Critical**.
   - Enter mandatory justification: *"Customer supplies sterile injectables facility."*
   - Submit override.
   - Show that the proposal transitions to `MODIFIED` and the complaint record updates to `Critical` instantly.

---

### 5. 7-Stage Lifecycle & RBAC Concurrency (07:00)
1. View the **7-Stage Lifecycle Stepper**:
   - `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `PENDING_TRIAGE` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `INVESTIGATION` $\rightarrow$ `QUALITY_DECISION` $\rightarrow$ `CLOSED`
2. Demonstrate transitioning from `PENDING_TRIAGE` to `UNDER_REVIEW`.
3. Explain the **Optimistic Concurrency Control (OCC)**:
   - If two reviewers simultaneously try to decide on the same proposal, the second receives an explicit **HTTP 409 Conflict** (`PROPOSAL_ALREADY_REVIEWED`).
4. Explain **RBAC**: Operators cannot close complaints or review quality risk proposals; only `QUALITY_REVIEWER` and `QUALITY_MANAGER` have GxP decision authority.

---

### 6. 21 CFR Part 11 Audit Trail & AI Telemetry (08:30)
1. Scroll down to the **Audit Timeline**:
   - Show the chronological event trail.
   - Highlight the **Before vs AI Proposed vs Human Override vs Final** delta contract:
     ```json
     "diffs": {
       "severity": {
         "before": "Medium",
         "ai_proposed": "High",
         "human_override": "Critical",
         "final": "Critical"
       }
     }
     ```
   - Highlight actor attribution: `AI-Agent (AI-EE38C5)` vs `qa_reviewer_01 (QUALITY_REVIEWER)`.
2. Open the **AI Telemetry Inspector**:
   - Show the exact `Requested Model` (`gemma2-9b-it`), `Actual Model` (`openai/gpt-oss-20b`), latency, token counts, and transparent fallback reason.
3. Conclude by demonstrating one-command test execution:
   ```bash
   make test
   ```
