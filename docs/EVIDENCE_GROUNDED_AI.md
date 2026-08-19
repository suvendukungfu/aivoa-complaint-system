# Evidence-Grounded AI Architecture & Provenance Specification

## Executive Summary

The AIVOA Pharmaceutical Complaint Management System implements an **Evidence-Grounded AI Engine** designed to meet stringent **FDA 21 CFR Part 11**, **EU Annex 11**, and **ICH Q9 Quality Risk Management** standards. 

In regulated pharmaceutical API/FDF manufacturing environments, AI systems must never act as opaque black boxes. Every AI-extracted complaint entity, classification, and risk triage indicator is deterministically anchored to verifiable source evidence (uploaded PDF/DOCX/TXT/EML documents or direct customer prompts).

---

## 1. Core Architectural Tenets

### 1.1 Strict Anti-Fabrication Invariant (Zero Hallucinated Citations)
* **Rule**: If a field value or risk indicator does not have a direct, verifiable text span in the source input, the system **never fabricates or hallucinates text quotes**.
* In such cases, the system explicitly marks:
  * `source_type`: `"customer_prompt"` or `"ai_inference"`
  * `classification`: `"INFERRED"`
  * `text_span`: `null`
  * `page_number`: `null`
  * `confidence`: Adjusted baseline (e.g. `0.85`)

### 1.2 Verbatim Text Span Preservation
* For all explicitly extracted entities (e.g. `Batch No: PA240812`, `Paracetamol API 500mg`, `50 kg`), the exact verbatim line or phrase from the source document is captured and preserved without alteration.

### 1.3 Page-Aware Document Citations
* Page numbers (`page_number: int`) are **strictly populated only when actually known** from page-aware parsing structures (e.g. PDF multi-page iterators).
* For unpaginated formats (plain text, Word paragraphs, email bodies, chat prompts), `page_number` remains `null`.

### 1.4 Immutable Audit & Provenance History
* When an operator modifies a field, the active record's provenance is updated to `USER_SPECIFIED` (`source_type: "user_edit"`).
* The preceding AI-extracted provenance remains permanently preserved in the immutable append-only audit event log (`ComplaintEvent` table).

---

## 2. Evidence Grounding Data Contract

### 2.1 Field Evidence Item Schema (`FieldEvidenceItem`)

```json
{
  "field": "batch_number",
  "value": "PA240812",
  "source_type": "uploaded_document",
  "source_document_id": "Sample_1_Foreign_Particles_Paracetamol.pdf",
  "page_number": 1,
  "text_span": "Batch No: PA240812",
  "confidence": 0.98,
  "ai_run_id": "AI-93D22C",
  "classification": "EXPLICIT_EXTRACTED",
  "updated_at": "2026-08-18 04:30:00 UTC"
}
```

#### Field Attributes

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `field` | `string` | Canonical database attribute name (e.g., `batch_number`, `product_name`). |
| `value` | `any` | Extracted or normalized entity value. |
| `source_type` | `enum` | Origin channel: `uploaded_document`, `customer_prompt`, `user_edit`, `ai_inference`, `deterministic_rule`. |
| `source_document_id`| `string?` | Sanitized filename or cryptographic SHA-256 identifier of the source file. |
| `page_number` | `int?` | 1-based page number where evidence span appears (only if known). |
| `text_span` | `string?` | Exact verbatim contextual quote from source (or `null` if inferred). |
| `confidence` | `float` | Signal-grounded confidence score between `0.0` and `1.0`. |
| `ai_run_id` | `string?` | Telemetry correlation ID of the LangGraph execution run. |
| `classification` | `enum` | `EXPLICIT_EXTRACTED` (verbatim match) \| `INFERRED` (contextual deduction) \| `USER_SPECIFIED` (manual edit). |

---

### 2.2 Risk Assessment Evidence Grounding Schema (`RiskEvidenceItem`)

```json
{
  "risk_factor": "Foreign particulate matter",
  "severity_impact": "High / Critical",
  "evidence": "Customer detected visible black specks in drum 1 during weighing",
  "source": "Paracetamol_Complaint.pdf",
  "page_number": 1,
  "classification": "EXPLICIT_EXTRACTED"
}
```

---

## 3. Verbatim Extraction & Evidence Matching Algorithm

```
                  ┌───────────────────────────────────┐
                  │   Uploaded Document / Raw Input   │
                  └─────────────────┬─────────────────┘
                                    │
                       [Page-Aware Parser]
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
        Multi-Page Document                   Unpaginated Document
    (PDF: Pages 1..N + Text)                (DOCX / TXT / EML / Chat)
                 │                                     │
                 └──────────────────┬──────────────────┘
                                    │
                                    ▼
                     [FieldProvenanceEngine]
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼                                                         ▼
[Verbatim Substring Search]                               [No Exact Match]
• Match found in text lines?                              • Field deduced from context?
  ├── YES:                                                  ├── YES:
  │   - text_span: "Batch No: PA240812"                     │   - text_span: null
  │   - classification: EXPLICIT_EXTRACTED                  │   - classification: INFERRED
  │   - confidence: 0.98                                    │   - source_type: "ai_inference"
  │   - page_number: locate_page_number()                   │   - page_number: null
  │                                                         │   - confidence: 0.85
  └── NO:                                                   └── (Anti-Fabrication Enforced)
      Proceed to Inferred classification.
```

---

## 4. Frontend User Experience & Evidence Viewer

### 4.1 Field Hover & Click Popover (`EvidencePopover.tsx`)
Hovering or clicking on any field in the **Log Customer Complaint** form reveals an interactive provenance card:
* 🏷️ **Status Badge**: `⚡ AI Extracted` (Blue), `💡 AI Inferred` (Amber), or `👤 User Edited` (Emerald).
* 📄 **Source**: `Complaint PDF: Sample_1_Foreign_Particles_Paracetamol.pdf` (or `Customer Prompt`).
* 📄 **Page Citation**: `Page 1` (rendered only if page information exists).
* 🔍 **Verbatim Evidence Card**: Highlighted quote block containing the source snippet.
* ⚡ **AI Run Metadata**: `Run: AI-93D22C` with exact confidence percentage.
* 🔘 **[Open Evidence] Button**: Launches the full-screen Document Evidence Viewer.

### 4.2 Document Evidence Viewer (`DocumentEvidenceViewer.tsx`)
A dedicated text-based document inspection workspace:
* **Interactive Field Navigation Chips**: One-click switching between `batch_number`, `product_name`, `customer_name`, and `description`.
* **Synchronized Auto-Scrolling**: Instantly jumps to and highlights the target snippet in luminous yellow.
* **One-Click Citation Copying**: Allows quality investigators to copy verified text snippets directly to their clipboard for regulatory submissions.

---

## 5. Automated Verification & Quality Gates

The Evidence-Grounded AI Engine is validated against 6 core test suites in [`backend/tests/test_evidence_grounding.py`](file:///Users/suvendusahoo/Downloads/aivo/backend/tests/test_evidence_grounding.py):

```bash
backend/.venv/bin/pytest backend/tests/test_evidence_grounding.py -v
```

| Verification Test | Objective | Result |
| :--- | :--- | :--- |
| `test_verbatim_text_span_preservation` | Asserts exact phrase `"Batch No: PA240812"` is captured with `EXPLICIT_EXTRACTED`. | ✅ PASS |
| `test_missing_evidence_is_not_fabricated` | Asserts missing fields receive `text_span: null` and `INFERRED` without hallucinating quotes. | ✅ PASS |
| `test_page_number_only_shown_when_known` | Asserts multi-page PDF returns integer page (e.g. `2`), while text/email returns `None`. | ✅ PASS |
| `test_ai_inference_classification_labeling` | Asserts derived fields are distinguished from verbatim extracts. | ✅ PASS |
| `test_risk_assessment_evidence_grounding` | Asserts risk factors link directly to defect evidence sentences in text. | ✅ PASS |
| `test_field_mutation_updates_provenance` | Asserts editing a field updates provenance to `USER_SPECIFIED` while preserving old provenance in audit ledger. | ✅ PASS |

---

## 6. Compliance Alignment

| Standard | Requirement | AIVOA Evidence Grounding Implementation |
| :--- | :--- | :--- |
| **FDA 21 CFR Part 11 § 11.10(e)** | Computer-generated, time-stamped audit trails | Every AI extraction and human modification records actor, timestamp, run ID, and verbatim evidence citations. |
| **ICH Q9 (Quality Risk Management)** | Decision-making based on scientific evidence | Initial severity and priority triaging must link directly to observable defect symptoms. |
| **ALCOA+ Principles** | Attributable, Legible, Contemporaneous, Original, Accurate | AI suggestions are attributed to specific run IDs and source document hashes (`SHA-256`). |
