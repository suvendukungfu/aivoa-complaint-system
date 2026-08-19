# AIVOA Known Limitations & Production Readiness Declarations

**Document Version**: 1.0.0 (Phase 10 Hardening)  
**Scope**: Technical honesty, regulatory boundaries, and engineering scope declarations  

---

## 1. Known Architectural & Operational Limitations

1. **AI is Not a Final Quality Authority**:
   - The AI engine (LangGraph + Groq) functions strictly as an extraction, triage, and drafting copilot.
   - All severity assessments, field modifications, and lifecycle transitions require explicit human Quality Reviewer authorization.
   - AI outputs must never bypass human review in actual GxP operations.

2. **Formal Regulatory Validation (IQ/OQ/PQ) Not Performed**:
   - While the audit trail and state machine are designed with 21 CFR Part 11 and GxP principles in mind, formal installation, operational, and performance qualification (IQ/OQ/PQ) protocols have not been executed on this codebase.

3. **OCR Scope**:
   - Current document ingestion parses digitally generated PDFs, Word (`.docx`), plain text (`.txt`), and email headers (`.eml`).
   - Scanned image-only PDFs requiring heavy optical character recognition (OCR) or handwriting recognition require integration with an enterprise OCR engine (such as AWS Textract or Google Cloud Document AI).

4. **Upstream Groq Model Availability & Failover**:
   - The assignment-requested primary model is `gemma2-9b-it`.
   - Upstream Groq Cloud API deprecated `gemma2-9b-it` on their infrastructure. The application transparently cascades to active fallbacks (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, or deterministic rule extractors) with explicit telemetry logging.

5. **Local Persistence Fallback**:
   - PostgreSQL is the designated production/assignment database (configured in `docker-compose.prod.yml` and managed via Alembic migrations).
   - In local developer environments without an active PostgreSQL daemon, the application gracefully initializes a local SQLite database file (`complaints.db`).

6. **Authentication & Identity Provider**:
   - The demo application implements role switching (Operator, Reviewer, Manager, Admin) via header context simulation.
   - Production deployment requires integration with enterprise Identity Providers (IdP) via OAuth2/OIDC, SAML 2.0, or LDAP with multi-factor authentication (MFA).

7. **Document & Evidence Storage**:
   - Uploaded customer documents are processed in-memory or persisted to local disk storage in development.
   - Production deployment requires immutable, encrypted object storage (e.g. AWS S3 with Object Lock or GCP Cloud Storage with retention policies).

8. **Rate Limits on Free-Tier Cloud Inference**:
   - The system utilizes free/on-demand tier Groq API keys during testing, which have token-per-day rate limits.
   - High-throughput production deployments require dedicated enterprise API keys or self-hosted vLLM inference clusters.

9. **Semantic Similarity Duplicate Matching**:
   - Duplicate detection currently uses lexical batch/product indexing and heuristic parameter similarity.
   - Scaling to millions of historical records would benefit from dedicated vector databases (e.g. pgvector or Qdrant) with HNSW indexes.

10. **Automated Notification & CAPA Integration**:
    - The system models complaint triage through closure inside AIVOA. Integration with enterprise ERP/CAPA systems (e.g. TrackWise, Veeva Vault QMS, SAP) would be implemented via outgoing webhooks or message queues in production.
