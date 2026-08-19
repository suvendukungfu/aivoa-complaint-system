# AIVOA Complaint Management System — 5–10 Minute Demo Script & Technical Walkthrough

This script is structured for live product engineering demonstrations and technical interviews.

---

### ⏱️ 0:00 – 0:40 | Problem & Product Overview
- **Opening**: "Today I'm presenting the **AIVOA AI-Powered Customer Complaint Management System** tailored for pharmaceutical API and Finished Dosage Form (FDF) manufacturing."
- **The Core Problem**: "In pharmaceutical manufacturing, customer complaint intake traditionally requires manual data entry across ERP and QMS systems, leading to transcription errors, delayed batch quarantines, and incomplete regulatory reporting."
- **Our Solution**: "AIVOA introduces an AI-native Quality Co-pilot that extracts structured data from natural language and documents, executes initial risk triage via LangGraph, and populates the official QMS record with strict audit traceability."

---

### ⏱️ 0:40 – 2:00 | Natural-Language Complaint Intake
- **Action**: In the AIVOA Co-pilot chat (or quick action chip), input:
  > *"ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."*
- **What to highlight**:
  1. Notice the live status indicator transitioning through LangGraph nodes (*"Normalizing input"*, *"Extracting entities"*, *"Assessing initial risk"*).
  2. The left-side **Log Customer Complaint** form auto-populates instantly.
  3. Every updated field displays a glowing pulse and an **"✨ AI updated"** badge with confidence metrics (e.g., `98% confidence`).
  4. Point out that the user didn't have to type anything manually into the form.

---

### ⏱️ 2:00 – 3:00 | AI Risk Assessment & Regulatory Triage
- **Action**: Direct the reviewer's attention to the **AI Co-pilot Risk Assessment** card.
- **What to highlight**:
  1. **Severity & Priority**: Classified as **High / Urgent** due to foreign particulate contamination in an active pharmaceutical ingredient.
  2. **Rationale**: Explains why black specks represent a direct product quality hazard.
  3. **Recommended Actions**: Lists standard QMS triage steps (quarantine reserve samples, initiate Batch Manufacturing Record review, request FTIR analysis).
  4. **Compliance Disclaimer**: Prominently notes that *"AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel."*

---

### ⏱️ 3:00 – 4:00 | Natural-Language Editing (Safe Merge Semantics)
- **Action**: In the chat box, type:
  > *"Change the affected quantity to 40 kg."*
- **What to highlight**:
  1. Observe the left form: **Only the Affected Quantity field changes from 25 to 40 kg**.
  2. The **Product Name** (`Paracetamol API`), **Batch Number** (`PA240812`), **Customer Name**, and **Dates** remain 100% preserved.
  3. Explain the LangGraph edit node architecture: safe merge semantics clone the state, apply a key-level diff, and prevent state corruption.
  4. Test another edit: *"Change the batch number to PA240813."* -> Show batch number updating cleanly while other fields remain untouched.

---

### ⏱️ 4:00 – 5:30 | Document Extraction (PDF / DOCX / TXT / EML)
- **Action**:
  1. Click **Reset** in the top navigation to demonstrate zero-reload state resetting.
  2. Drag and drop `sample_data/Sample_1_Foreign_Particles_Paracetamol.pdf` (or click to browse).
- **What to highlight**:
  1. The progress bar displays upload and parsing progress.
  2. Text extraction extracts paragraph and tabular data from the PDF.
  3. LangGraph processes the extracted text, populates the entire form, and recalculates the risk assessment.
  4. Mention multi-format support: `PDF`, `DOCX`, `TXT`, and `EML` (with email header parsing up to 10 MB).

---

### ⏱️ 5:30 – 6:15 | QMS Complaint Completeness Assessment
- **Action**:
  1. Click the **"Check Completeness"** button. Show the QMS completeness score widget (e.g. `85%`) with missing field indicators and recommendations.
  2. Explain that the completeness checker highlights missing critical vs. optional fields to prevent incomplete regulatory submissions.

---

### ⏱️ 6:15 – 7:00 | Persistence to PostgreSQL
- **Action**:
  1. Click **"Save Complaint"**.
  2. Highlight the assigned QMS ID: **`CMP-2026-0001`** and status **`Pending Triage`**.
  3. Click **"QMS Registry"** in the top navbar to open the database modal, showing the stored complaint in PostgreSQL with audit event logs.
  4. Demonstrate search and "Load into Form" from the historical registry.

---

### ⏱️ 7:00 – 9:00 | Architecture & Code Walkthrough
- **Action**: Walk the reviewer through key architectural decisions:
  1. **Redux Single Source of Truth**: The UI form is purely controlled; it reflects `state.complaint.data` directly.
  2. **LangGraph StateGraph**:
     `input_normalization` ➔ `complaint_extraction` ➔ `field_validation` ➔ `completeness_analysis` ➔ `risk_assessment` ➔ `state_merge` ➔ `response_generation`.
  3. **Groq Integration**: Default model `gemma2-9b-it` (with fallback to `llama-3.3-70b-versatile` or deterministic safety rules).
  4. **PostgreSQL Relational Design**: `complaints`, `complaint_events`, `complaint_documents` with relational FKs and event logs.

---

### ⏱️ 9:00 – 10:00 | Production Improvements & Interview Q&A

#### Key Interview Talking Points:

1. **Why Redux?**
   Because AI-generated updates need a centralized source of truth and multiple UI components (Form, Co-pilot, Audit Drawer, Registry Modal) need synchronized complaint state without prop drilling.

2. **Why LangGraph?**
   Because pharmaceutical complaint intake is a stateful, multi-step quality workflow (normalization ➔ LLM extraction ➔ data dictionary validation ➔ completeness scoring ➔ deterministic risk triage) rather than an uncontrolled single prompt-response interaction.

3. **Why Structured Output & Pydantic?**
   Because free-form LLM text should never directly mutate enterprise database state. Pydantic guarantees field type safety, regex validation on dates/batches, and safe failure handling.

4. **Why PostgreSQL?**
   Because complaint records, event audit logs, documents, and regulatory tracking are relational business data requiring ACID transactions and relational integrity.

5. **Why Deterministic Checks?**
   Because LLM output in regulated industries must be constrained and validated rather than blindly trusted. If the LLM misses a critical contamination keyword, deterministic safety rules catch it.

6. **Why Field-Level Safe Merge?**
   Because natural-language corrections (e.g. "Change quantity to 40 kg") must strictly preserve existing complaint information (product, batch, dates, customer) rather than regenerating the entire state.

7. **What would a fully regulated production system require?**
   - **Role-Based Access Control (RBAC)**: Segregation of duties between QA Associate, Quality Lead, and Qualified Person (QP).
   - **21 CFR Part 11 / EU Annex 11 Compliance**: Cryptographic electronic signatures, password re-authentication for complaint closure, and tamper-evident append-only audit trails.
   - **Cloud Object Storage**: S3/GCS with KMS encryption and virus scanning for uploaded complaint attachments.
   - **Production OCR Engine**: AWS Textract or Google Cloud Document AI for scanned handwritten reports.
   - **ERP / QMS Connectors**: Real-time integration with SAP S/4HANA (Batch Release) and Veeva Vault QMS.
