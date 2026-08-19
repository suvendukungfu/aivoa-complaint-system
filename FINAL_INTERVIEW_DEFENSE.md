# AIVOA — Technical Interview Defense Guide
**20 Staff-Level Engineering Questions & Rigorous Answers**

---

### 1. Why LangGraph?
**Answer:**  
LangGraph models our multi-step AI pipeline as a deterministic state machine with explicit cycles and conditional branching. Unlike simple chain-based abstractions, LangGraph gives us:
1. **Explicit state schema** (`ExtractionState`) containing normalized fields, raw inputs, confidence scores, and error channels.
2. **Deterministic error boundaries** between nodes (e.g. if extraction fails, state transitions directly to the deterministic rule-based extractor node without crashing).
3. **Observability and replayability**: Each step (Normalize → Extract → Validate → Evidence Grounding → Policy Floor → Proposal) produces an auditable trace.

---

### 2. Why not simply call the LLM once in a single prompt?
**Answer:**  
A single prompt combining entity extraction, schema formatting, risk categorization, and evidence grounding suffers from several critical failure modes:
1. **High cognitive load on the LLM**: Forcing the model to simultaneously extract 16 fields and assign regulatory risk increases hallucination rates.
2. **Lack of deterministic safety boundaries**: A single prompt cannot enforce deterministic policy floors (e.g., ensuring foreign matter in bulk API is always flagged as High/Critical).
3. **Failure all-or-nothing**: If one field fails validation in a monolithic prompt, the entire response is discarded. In LangGraph, extraction, validation, and risk policy are decoupled into separate nodes.

---

### 3. Why Redux Toolkit on the frontend?
**Answer:**  
In a GxP Quality Operations interface, UI state complexity is high: simultaneous management of active complaint draft fields, live provenance metadata, AI execution logs, optimistic concurrency counters, and modal review queues. Redux Toolkit provides:
1. **Single Source of Truth**: Clear separation between complaint draft data (`complaintSlice`), AI execution telemetry (`aiSlice`), and UI workspace routing (`uiSlice`).
2. **Immutability guarantees**: Immer-backed reducers guarantee deterministic state transitions without silent in-place mutation bugs.
3. **Time-travel debugging and testability**: Slices can be tested with pure unit tests independently of React rendering lifecycles.

---

### 4. Why FastAPI?
**Answer:**  
FastAPI provides asynchronous, type-safe Python API execution with native Pydantic validation. It allows us to:
1. **Enforce strict request/response schemas** across all GxP endpoints.
2. **Auto-generate OpenAPI v3 documentation** for validation compliance audits.
3. **Execute async I/O efficiently** during external LLM API calls and database connection pooling.

---

### 5. How do you prevent hallucinated fields?
**Answer:**  
We employ a 4-layer defense in depth:
1. **Structured Pydantic Output**: LLM outputs are constrained to strict JSON schemas with typed enums.
2. **SafetyGate Validation**: A dedicated post-processing validator inspects every extracted field against allowed regexes, date boundaries, and enum sets. Invalid enums are normalized or rejected.
3. **Evidence Grounding Verification**: Extracted text spans are searched against the raw input text. If the text does not exist in the source, the field confidence is penalized and flagged for human review.
4. **Human Verification (HITL)**: All extracted fields remain in `PROPOSED` state until signed off by a Qualified Person.

---

### 6. How does provenance work?
**Answer:**  
For every extracted entity, AIVOA creates a `FieldProvenanceItem` record containing:
- `source_type`: Origin of data (`customer_prompt`, `uploaded_document`, `ai_inference`, or `user_edit`).
- `source_document_id` & `page_number`: Exact document reference (PDF page mapping).
- `text_span`: Exact verbatim string citation from source.
- `confidence`: Calibrated float score (0.0 to 1.0).
- `classification`: `EXPLICIT_EXTRACTED` (literal text in source), `INFERRED` (deduced parameter), or `USER_SPECIFIED` (manually edited).

---

### 7. How do you prevent fabricated evidence quotes?
**Answer:**  
Through our strict non-fabrication invariant:
When an entity is inferred (for example, deducing `complaint_type: "Foreign Matter / Contamination"` from a description mentioning black specks), the system explicitly tags the provenance classification as `INFERRED` and sets `text_span = None`.  
The backend test suite (`test_evidence_integrity.py`) asserts that only exact verbatim substrings of the source text are allowed as evidence spans; fabricating fake quotation strings triggers an immediate test failure.

---

### 8. Why is RiskPolicyEngine deterministic?
**Answer:**  
In pharmaceutical quality assurance, regulatory defect severity is governed by strict pharmacopeial and GMP standards (such as ICH Q9). An LLM might be influenced by minor wording variations to downplay a critical defect (e.g. classifying glass particulate as 'Medium' because the customer was polite).  
Our `RiskPolicyEngine` acts as an uncompromisable safety floor: regardless of LLM confidence, any complaint involving foreign particulate, active potency failure, or broken container closure is programmatically clamped to `High` or `Critical`.

---

### 9. Why is AI not allowed to make the final decision?
**Answer:**  
Under FDA 21 CFR Part 11 and EU Annex 11 regulations, final responsibility for batch disposition, defect classification, and corrective actions (CAPA) rests legally and ethically with authorized Quality Personnel (Qualified Persons / QA Directors).  
AI acts purely as an assistive copilot to accelerate data entry and highlight risks; final approval requires a human signature and documented rationale.

---

### 10. How does human override work?
**Answer:**  
When a Quality Reviewer disagrees with an AI recommendation (e.g. upgrading severity from `High` → `Critical`), they execute an **Override** action in `ProposalReviewModal`. The backend requires:
1. The human-specified final value.
2. A mandatory documented justification string.  
The system updates the active record, marks the proposal as `MODIFIED`, and appends an audit record storing both the original AI recommendation and the human decision with full justification.

---

### 11. How do you prevent double-approval race conditions?
**Answer:**  
Through optimistic concurrency control and transactional state checking in `complaint_service.py`:
When a proposal decision is submitted, the repository executes an atomic SQL transaction checking `proposal.status == 'PROPOSED'`. If a concurrent reviewer has already approved or rejected that proposal, the transaction aborts and returns `HTTP 409 Conflict` with error code `PROPOSAL_ALREADY_REVIEWED`.

---

### 12. How does Role-Based Access Control (RBAC) work?
**Answer:**  
We enforce a 4-tier RBAC matrix at the API gateway:
- `COMPLAINT_OPERATOR`: Can create and edit complaint intake drafts; cannot approve proposals or close records.
- `QUALITY_REVIEWER`: Can inspect evidence, approve/reject proposals, and apply human overrides; cannot close complaints.
- `QUALITY_MANAGER`: Can transition complaints through all lifecycle states and close complaints.
- `ADMIN`: Full configuration and audit access.  
Unauthorized actions return `HTTP 403 Forbidden`.

---

### 13. How does prompt injection protection work?
**Answer:**  
Incoming complaint text passes through `PromptInjectionScanner` before reaching the LLM orchestrator. It checks for adversarial jailbreaks ("Ignore previous instructions", "System Override", XML/Markdown delimiter attacks). Suspect text is quarantined, flagged in metadata, and sanitized to prevent instruction hijacking.

---

### 14. What happens if Groq is unavailable?
**Answer:**  
AIVOA implements a graceful, multi-tier fallback architecture:
1. **Secondary Model Fallback**: If the primary Groq model endpoint times out or returns a 503, the provider tries the configured secondary fallback model.
2. **Deterministic Regex Extractor**: If all remote LLM endpoints fail, the LangGraph graph routes to the local deterministic rule-based extractor node.
3. **Transparent UX**: The UI does not crash or fake a success state; it displays *"AI analysis unavailable. No complaint data was changed."* with a retry action, and logs `fallback=true` in telemetry.

---

### 15. Why does the requested model differ from the actual model?
**Answer (Truthful Statement):**  
> *"AIVOA is configured to request Groq `gemma2-9b-it` as the assignment-required primary model. During verification, Groq reported that model unavailable on the cloud endpoint, so the provider transparently fell back to `openai/gpt-oss-120b`. The system records requested and actual model separately."*

---

### 16. Why PostgreSQL?
**Answer:**  
PostgreSQL provides ACID compliance, strong foreign key constraints, robust JSONB support for field provenance storage, and sequence-based atomic complaint number generation (`CMP-2026-XXXX`). In development, we support local SQLite for fast iteration, while production uses PostgreSQL 16 via Docker Compose.

---

### 17. How would you scale this system to 10,000+ complaints daily?
**Answer:**  
1. **Asynchronous Task Queue**: Decouple document ingestion using Celery or RabbitMQ/Redis for background OCR and PDF text extraction.
2. **Read/Write DB Splitting**: Direct analytical queries and audit log reviews to read-replicas.
3. **Stateless API Tier**: Horizontal scaling of FastAPI containers behind an NGINX or AWS ALB load balancer.
4. **Model Rate Limiting & Batching**: Token bucket rate limiters to queue Groq API requests without dropping traffic.

---

### 18. How would you deploy this to production?
**Answer:**  
1. **Containerization**: Multi-stage Dockerfile packaging FastAPI backend with Gunicorn/Uvicorn workers and static NGINX serving the built React bundle.
2. **Orchestration**: Deploy to AWS ECS / Fargate or Kubernetes with auto-scaling groups.
3. **Database**: AWS RDS PostgreSQL Multi-AZ with automated encrypted snapshots.
4. **Security**: AWS Secrets Manager for Groq API keys, AWS WAF for DDoS protection, and HTTPS/TLS 1.3 encryption.

---

### 19. What would you change before true commercial production deployment?
**Answer:**  
1. **Enterprise SSO**: Replace header-based demo RBAC with SAML 2.0 / OAuth2 OpenID Connect (Okta / Azure AD).
2. **Full Computer System Validation (CSV / CSA)**: Execute IQ/OQ/PQ validation test protocols under 21 CFR Part 11 requirements.
3. **Industrial OCR Pipeline**: Integrate AWS Textract or Azure Document Intelligence for low-DPI physical scanned documents.
4. **Digital Signatures**: Implement PKI-based cryptographic digital signatures with dual-authentication for QA approvals.

---

### 20. What are the key limitations of the current implementation?
**Answer:**  
1. **Assistive Nature**: AI suggestions are strictly advisory; all regulatory decisions remain human-in-the-loop.
2. **Document Parsing**: Implemented for standard digital PDFs, DOCX, TXT, and EML; scanned image PDFs with handwritten notes require external commercial OCR.
3. **Model Cloud Availability**: Groq cloud endpoint availability determines whether `gemma2-9b-it` or fallback models execute.
