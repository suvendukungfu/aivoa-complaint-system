# AIVOA — Final Technical Interview Demo Script

---

## 1. Demo Structure & 10-Minute Timeline

| Timestamp | Section | Key Talking Point / Goal | Action on Screen |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:40** | **The Problem** | Pharmaceutical complaints arrive as unstructured emails/PDFs. Manual transcription is slow, error-prone, and lacks real-time risk triage. | Show Overview Dashboard with incoming queue metrics. |
| **00:40 – 01:15** | **Product Overview** | AIVOA structures complaints with strict evidence provenance and human-in-the-loop governance. | Navigate to Complaint Intake workspace. |
| **01:15 – 02:00** | **Natural-Language Intake** | Paste flagship narrative: *"ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812..."* | Click Send in Copilot panel. |
| **02:00 – 02:45** | **AI Extraction** | LangGraph orchestrates entity extraction into 16 discrete regulatory fields across 4 GxP sections. | Observe 2-column form auto-populate. |
| **02:45 – 03:30** | **Evidence Grounding** | Every field has a verifiable source span. Zero-fabrication guarantee: inferred fields are explicitly marked without fake citations. | Click provenance badge to open verbatim text popover. |
| **03:30 – 04:15** | **Quality Risk Assessment** | ICH Q9 regulatory policy engine evaluates defect factors (Foreign matter in Active Pharmaceutical Ingredient). | Show Risk Triage card (`High` defect severity, `Urgent` priority). |
| **04:15 – 05:00** | **AI Proposal Generation** | AI suggestions are generated as immutable `AIProposal` items awaiting human review. | Show proposal card (`PROP-2026-0001: Severity Medium → High`). |
| **05:00 – 06:00** | **Human Review & Override** | Qualified Person (QP) reviews proposal, inspects verbatim evidence, and overrides to `Critical` with required rationale. | Open Proposal Review Modal, select Override, enter justification, submit. |
| **06:00 – 06:45** | **Approval & Lifecycle** | State machine advances complaint from `PENDING_TRIAGE` → `UNDER_REVIEW` → `INVESTIGATION`. | Advance lifecycle stepper in Review Workspace. |
| **06:45 – 07:30** | **21 CFR Part 11 Audit Trail** | Immutable append-only ledger records exact timestamp, actor (`Quality Reviewer`), previous AI value, and human decision. | Open Audit Trail subtab, show event diff block. |
| **07:30 – 08:15** | **System Architecture** | Explain layered stack: React/Redux → FastAPI → LangGraph StateGraph → PostgreSQL. | Reference architecture diagram. |
| **08:15 – 09:00** | **Security & Concurrency** | 4-tier RBAC matrix, prompt injection containment, SQL injection immunity, and optimistic locking against double-approvals (409 Conflict). | Show RBAC enforcement and concurrency tests. |
| **09:00 – 09:30** | **Model Transparency** | Truthful model telemetry: Groq `gemma2-9b-it` requested, transparent fallback logging. | Show System Health view. |
| **09:30 – 10:00** | **Testing & Conclusion** | 76 backend tests, 14 frontend tests, 1 real AI smoke, 0 linter errors, 212ms production build. | Show test suite output in terminal. |

---

## 2. Minute-by-Minute Verbal Script

### 00:00 — The Problem & Context
> *"In pharmaceutical manufacturing and distribution, customer complaints arrive as raw emails, phone transcripts, and supplier Certificates of Analysis. Quality teams struggle with slow manual transcription, inconsistent defect risk categorization, and audit trail gaps.  
> However, in regulated GxP environments, an AI cannot simply 'take action' autonomously. Every data point must be grounded in source text, and every quality decision requires documented human sign-off."*

### 00:40 — Product Solution & Overview
> *"AIVOA is designed from the ground up for Quality Operations teams. Here on the Overview Dashboard, we see our active queue backlog, open complaints, and defect severity distributions without any decorative fluff."*

### 01:15 — Flagship Intake & Extraction
> *"Let's navigate to the Complaint Intake workspace. We'll paste an incoming customer email:*  
> **'ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected.'**  
> *When we submit this to the AIVOA Copilot, our FastAPI backend initiates a stateful LangGraph pipeline."*

### 02:00 — Extraction & Form Population
> *"Notice the 4 structured sections populate immediately:*  
> 1. *Complaint Source: ABC Pharma, Customer Email, Today's Date.*  
> 2. *Product Identification: Paracetamol API 99.5%, Batch PA240812, Mfg Aug 2026, Exp Aug 2028, 25 kg.*  
> 3. *Defect Classification: Foreign Matter / Contamination.*  
> 4. *Quality Assessment: High Severity, Urgent Priority.*  
> *Notice that every single field has a subtle provenance badge."*

### 02:45 — Evidence Grounding & Zero Fabrication
> *"If I click on the provenance badge next to Customer Name or Batch Number, AIVOA shows the exact source origin, 98% confidence score, and the verbatim source text span.*  
> *Crucially, we have a strict non-fabrication guarantee: when a field is inferred rather than explicitly stated, AIVOA labels it as `INFERRED` and sets the text span to `null` rather than manufacturing a fake quote."*

### 03:30 — Quality Risk Assessment & Policy Floor
> *"Our RiskPolicyEngine evaluates ICH Q9 regulatory rules. Because foreign particulate in an Active Pharmaceutical Ingredient poses direct patient safety risk, our deterministic safety floor ensures the defect cannot be silently downgraded by the model."*

### 04:15 — AI Proposals (Human-in-the-Loop)
> *"The AI does not unilaterally overwrite records. Instead, it generates an immutable `AIProposal` item in the Quality Review Queue."*

### 05:00 — Human Review & Override Decision
> *"Let's switch to the Review Queue as a Qualified Person (QP). We inspect the AI proposal recommending `High` severity.  
> As a human reviewer, I determine that because this contamination occurred in bulk API, this requires batch-wide quarantine and escalation to `Critical`.  
> I select **Override**, choose `Critical`, and enter the mandatory regulatory justification:*  
> **'Potential batch-wide particulate contamination requires immediate quarantine.'**  
> *Notice that AIVOA enforces this justification—it is impossible to override without documenting why."*

### 06:00 — Lifecycle Transition
> *"Once the proposal is approved, the complaint record status automatically updates, and we advance the complaint state machine from `PENDING_TRIAGE` to `UNDER_REVIEW` and `INVESTIGATION`."*

### 06:45 — 21 CFR Part 11 Immutable Audit Trail
> *"If we navigate to the Audit Trail tab, we see the complete chronological ledger.  
> It records the exact timestamp, actor (`Quality Reviewer`), the AI-proposed value (`High`), the human-override decision (`Critical`), and the full justification text.  
> The AI recommendation is preserved forever in the audit log rather than being erased."*

### 07:30 — Architecture & Scalability
> *"Let's look at the architecture behind this:*  
> - *Frontend: React 18 with Redux Toolkit and design tokens for predictable UI state management.*  
> - *Backend: FastAPI with LangGraph state machines orchestrating normalization, extraction, schema validation, evidence grounding, and proposal generation.*  
> - *Persistence: PostgreSQL with SQLAlchemy and Alembic schema migrations.*  
> - *Model Integration: Groq provider with structured Pydantic outputs and deterministic fallback logic."*

### 08:15 — Security & Concurrency
> *"For security:*  
> - *4-tier RBAC matrix enforced at the API boundary (Complaint Operators cannot approve proposals or close complaints).*  
> - *Optimistic locking prevents race conditions: if two reviewers simultaneously attempt to approve the same proposal, the second request receives a `409 Conflict`.*  
> - *Prompt injection scanner sanitizes inputs before LLM invocation, and filename sanitizers prevent path traversal."*

### 09:00 — Truthfulness & Fallback Transparency
> *"We maintain strict truthfulness regarding our AI models:  
> AIVOA is configured to request Groq `gemma2-9b-it` as the primary model. During live API verification, Groq reported that model unavailable on the cloud endpoint, so our provider transparently fell back to `openai/gpt-oss-120b`. The telemetry on the System Health screen explicitly separates the requested model from the runtime model."*

### 09:30 — Testing & Quality Gates
> *"Our test suite includes:*  
> - *76 backend pytest tests covering extraction, safety gates, RBAC, failure recovery, and concurrency.*  
> - *14 frontend tests with 0 linter warnings.*  
> - *A 212ms production build.*  
> - *And a real AI smoke test verifying live inference against Groq."*

### 10:00 — Conclusion
> *"In summary, AIVOA demonstrates how modern AI can be safely and responsibly integrated into pharmaceutical quality operations: assistive extraction, grounded evidence, strict human governance, and an immutable audit trail. Thank you."*

---

## 3. Architecture Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                     │
│    (Overview • Intake • Review • Documents • Audit)     │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP / REST (X-Request-ID)
┌───────────────────────────▼─────────────────────────────┐
│                    FastAPI Backend                      │
│       (RBAC Middleware • Prompt Injection Scanner)      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   Complaint Service                     │
└─────────────┬─────────────────────────────┬─────────────┘
              │                             │
┌─────────────▼─────────────┐ ┌─────────────▼─────────────┐
│   LangGraph StateGraph    │ │   PostgreSQL Repository   │
│  ├── Extract Entities     │ │  ├── Immutable Complaints │
│  ├── Validate Schema      │ │  ├── AI Proposals Table   │
│  ├── Ground Evidence      │ │  └── 21 CFR Part 11 Audit │
│  ├── Risk Policy Floor    │ └───────────────────────────┘
│  └── Generate AIProposal  │
└─────────────┬─────────────┘
              │
┌─────────────▼─────────────┐
│       Groq Provider       │
│  (gemma2-9b-it / Fallback)│
└───────────────────────────┘
```
