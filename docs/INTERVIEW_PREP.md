# AIVOA Staff AI Product Engineer Interview Preparation Guide

## 1. The 2-Minute Executive Pitch

> "AIVOA is an enterprise-grade, AI-orchestrated Customer Complaint Management System built specifically for pharmaceutical API and Finished Dosage Form (FDF) manufacturing. 
> 
> Unlike generic LLM demos that suffer from hallucinations, data loss, and security vulnerabilities, AIVOA is architected around strict regulatory data integrity (FDA 21 CFR Part 11 / EU Annex 11). 
> 
> It leverages a LangGraph state machine, Groq high-speed inference, a deterministic RiskPolicyEngine with regulatory safety floors, an immutable append-only event ledger, a 100% field-preserving ChangeSet mutation model, and a 90-case golden CI evaluation platform that enforces zero tolerance for unauthorized field mutations."

---

## 2. The 5-Minute Technical Deep Dive

### 1. Dual-Workflow LangGraph State Machine
* **Complaint Intake Flow**: `SafetyGate` (prompt injection scan) -> `Groq LLM Extraction` (with multi-model fallback & telemetry) -> `Field Provenance & Confidence Scoring` -> `QMS Completeness Scoring` -> `RiskPolicyEngine` (deterministic ICH Q9 regulatory floors) -> `Duplicate Search` -> `Audit Trail Assembly`.
* **Natural-Language Edit Flow**: `Intent Interpretation` -> `SafetyGate Patch Filtering` -> `ChangeSetPipeline` (atomic patch merge strictly preserving 100% of untouched fields) -> `Audit Event Logging`.

### 2. Multi-Model Reliability & Telemetry
* Primary Requested Model: `gemma2-9b-it` (Required by assignment specification).
* Active High-Performance Fallbacks: `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, and deterministic regex entity parser.
* Zero-Falsehood Compliance: When upstream models are decommissioned (e.g. Groq HTTP 400), the system logs full telemetry (`requested_model`, `actual_model`, `fallback_used`, `fallback_reason`) in the `ai_runs` table rather than falsely claiming the requested model succeeded.

### 3. ChangeSet Mutation Architecture
* Traditional LLM re-generation corrupts untouched complaint fields.
* Our `ChangeSetPipeline` isolates mutations to sparse key-value delta dictionaries, computes before/after JSON diffs, detects sensitive field edits, and enforces human QA approval workflows when enabled.

### 4. Deterministic Risk Triage & Safety Floors
* LLMs cannot be trusted to unilaterally assign "Low" severity to high-risk defects.
* `RiskPolicyEngine` enforces hard regulatory safety floors (e.g., sterility failures, endotoxin contamination, or foreign particulate matter are automatically escalated to `Critical / Urgent` or `High / Urgent` with transparent adjustment reasoning).

---

## 3. Top Architecture Decisions & Trade-offs

| Decision | Why We Chose It | Trade-off / Alternative Considered |
| :--- | :--- | :--- |
| **Modular Monolith** over Microservices | Regulated pharmaceutical data requires atomic ACID transactions, zero network hop latency, and simple operational debugging. | Microservices introduce distributed transactions (Saga), network overhead, and eventual consistency risks. |
| **LangGraph** over CrewAI / AutoGen | LangGraph provides explicit deterministic graph topology, checkpointing, and cyclic state transitions essential for GxP validation. | Autonomous agent frameworks lack strict execution guarantees and produce non-deterministic loops. |
| **ChangeSet Delta Model** over Full Re-generation | Mathematically guarantees 100% untouched field preservation and computes granular audit diffs. | Requires custom patch validation pipelines before state application. |
| **Deterministic Policy Engine** over Pure LLM Scoring | Eliminates probabilistic risk under-classification on life-critical pharmaceutical defects. | Requires maintaining regulatory defect keyword dictionaries. |
| **Golden CI Benchmark** over Ad-hoc Testing | 90 golden cases mathematically test extraction, edits, risk, safety, and documents, failing CI on any unauthorized mutation. | Requires curating and maintaining representative GxP scenario fixtures. |

---

## 4. Key Questions & Answers for Technical Interviews

**Q: How do you prevent prompt injection when ingesting raw customer emails or documents?**  
> *"We employ a 3-layer defense-in-depth: First, `SafetyGate` uses 20+ pre-compiled regex heuristics scanning for delimiters, SQL commands, privilege escalation, and bypass tokens. Second, LangGraph isolates untrusted text inside `<UNTRUSTED_CONTENT>` tags with explicit instructions never to execute directives. Third, `ChangeSetPipeline` strips unauthorized keys and prevents AI from modifying complaint status or user permissions."*

**Q: How does the system guarantee that editing one field doesn't alter others?**  
> *"We use our `ChangeSetPipeline`. Instead of prompting the LLM to rewrite the entire complaint record, the prompt instructs the model to return ONLY a sparse JSON delta dictionary (`changed_fields`). The backend validates these keys against an approved whitelist and applies an in-memory atomic patch over the immutable base record, achieving a measured 100.0% untouched field preservation rate."*

**Q: What happens if Groq API goes down or rate limits are exceeded?**  
> *"The system implements graceful degradation via our `LLMProvider` multi-model fallback chain. If all remote endpoints fail or the network is offline, the deterministic regex QMS parser executes locally in < 5ms with zero network dependency, ensuring operations continue without downtime."*
