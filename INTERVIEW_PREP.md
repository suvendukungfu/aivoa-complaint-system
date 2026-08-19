# AIVOA Technical Interview Preparation Guide

**System**: AIVOA Pharmaceutical Customer Complaint Management System  
**Role Scope**: Staff Software Engineer / Principal AI Systems Architect / Product Engineer  

---

## 🎯 Core Technical Q&A Matrix

### 1. Why LangGraph?
> **Answer**: Pharmaceutical complaint intake is not a single linear LLM call; it requires a stateful, cyclical pipeline (normalization, extraction, schema validation, deterministic fallback, completeness scoring, risk policy evaluation, and duplicate matching). LangGraph provides typed state graphs (`StateGraph`), deterministic branch routing, inspection of intermediate steps, and checkpointing for human-in-the-loop review.

### 2. Why Groq?
> **Answer**: Groq's LPU (Language Processing Unit) delivers sub-second inference speeds (~600–1200ms per complaint extraction), making interactive dual-panel UI workflows responsive without sluggish spinner delays while keeping operating costs low.

### 3. Why gemma2-9b-it?
> **Answer**: `gemma2-9b-it` is a high-performance open-weight model specified by the assignment requirements that excels at structured JSON extraction and instruction following within a compact 9B parameter budget.

### 4. Why fallback?
> **Answer**: Cloud LLM providers can experience upstream model deprecations, outages, or rate limits. Rather than crashing or returning an opaque 500 error to a Quality Operator, our `GroqProvider` implements multi-model fallback (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) and a local deterministic regex parser, while logging both `requested_model` and `actual_model` truthfully in the audit trail.

### 5. Why PostgreSQL?
> **Answer**: Regulated QMS workflows demand strict ACID guarantees, strong schema constraints, relational integrity for foreign keys (`Complaint` ↔ `AIProposal` ↔ `AuditEvent`), row-level locking for concurrency control, and transactional migrations via Alembic.

### 6. Why Redux Toolkit?
> **Answer**: The dual-panel UI requires tightly synchronized state across the 16-field complaint form, the AI Copilot chat drawer, document evidence popovers, and reviewer proposal actions. Redux Toolkit provides predictable centralized state management, typed action thunks, and time-travel debugging.

### 7. Why a Modular Monolith?
> **Answer**: For this domain and scale, a modular monolith minimizes operational complexity (single deployment unit, zero distributed transaction overhead, shared in-process memory) while maintaining clean architectural boundaries (Presentation, API, Services, AI Agents, Repositories) that can be easily split into microservices if needed.

### 8. How do you prevent hallucinated fields?
> **Answer**: Through a three-layer defense:
> 1. **Prompt schema enforcement** with Pydantic output constraints.
> 2. **SafetyGate post-processing** that strips unauthorized keys not present in the QMS data dictionary.
> 3. **Deterministic parameter backfill** that extracts batch numbers and dates from source text using deterministic regex patterns.

### 9. How do you ground AI outputs?
> **Answer**: Our `ProvenanceTracker` searches source text for exact character offsets (`start_char`, `end_char`) for every extracted parameter. In the UI, clicking an AI field highlights the exact verbatim substring. Inferred fields (e.g. risk level) are explicitly tagged `INFERRED` with `text_span=None`, strictly preventing fabricated citations.

### 10. How do you prevent prompt injection?
> **Answer**: Dual-layer containment:
> 1. Ingress heuristic token scanner flags adversarial keywords (`SYSTEM OVERRIDE:`, `IGNORE INSTRUCTIONS`).
> 2. SafetyGate treats all LLM outputs as untrusted data, validating and coercing types through strict Pydantic schemas before writing to state or database.

### 11. How does Human-in-the-Loop (HITL) work?
> **Answer**: AI outputs are staged as `AIProposal` records in status `AI_PROPOSED`. Qualified Quality Reviewers inspect proposed values alongside verbatim evidence and duplicate alerts. The reviewer can approve, reject (with mandatory reason), or override the value before the change is committed.

### 12. How do you prevent double approval (concurrency collisions)?
> **Answer**: We use Optimistic Concurrency Control (OCC) and database row-level locking (`with_for_update`). If two reviewers attempt to approve or modify the same proposal simultaneously, the first transaction commits and the second receives `HTTP 409 Conflict (PROPOSAL_ALREADY_REVIEWED)`.

### 13. How do you audit human overrides?
> **Answer**: Every override requires a mandatory GxP justification string. The system updates the proposal status to `MODIFIED` and appends an immutable `AuditEvent` capturing the actor ID, role, timestamp, old AI value, new human value, and justification.

### 14. How would you scale to 1 million complaints?
> **Answer**:
> 1. **Database**: PostgreSQL read replicas with table partitioning by complaint year/status.
> 2. **Search**: Offload historical duplicate search to a dedicated vector engine (pgvector / Qdrant) with HNSW indexing.
> 3. **Asynchronous Ingestion**: Celery / RabbitMQ queue for batch document ingestion.
> 4. **Caching**: Redis caching for read-heavy reviewer dashboards and QMS data dictionaries.

### 15. What happens if Groq goes down?
> **Answer**: The system catches the API connection failure and automatically triggers the deterministic rule-based fallback extractor (`fallback_deterministic_extractor`). The complaint is parsed using regex heuristics and saved with `actual_model="deterministic-rule-extractor"` and `fallback_used=True`.

### 16. What happens if PostgreSQL goes down?
> **Answer**: The readiness probe (`/api/health/ready`) immediately returns `503 Service Unavailable`, preventing traffic ingress. In local development mode, the system automatically falls back to a local SQLite database (`complaints.db`).

### 17. What would you change for a real production GxP deployment?
> **Answer**:
> 1. Integrate enterprise IdP via OAuth2/OIDC with MFA and digital signature attestation (21 CFR Part 11).
> 2. Store documents in encrypted cloud object storage (AWS S3 with Object Lock).
> 3. Implement full IQ/OQ/PQ formal validation protocols with signed test scripts.
> 4. Connect to enterprise CAPA/ERP systems (Veeva Vault, TrackWise, SAP) via secure webhooks.
