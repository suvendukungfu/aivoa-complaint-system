# ADR 009: AI Run Tracing & Decision Correlation Identifiers

## Context
Pharmaceutical auditors and Quality Assurance managers require full reproducibility for every automated decision. If an AI model infers high severity or extracts a lot number, QMS regulations require recording which model generated the output, the exact prompt version, execution latency, and token consumption.

## Decision
We introduced a correlated AI Decision Trace schema backed by the `ai_runs` database entity. Every execution through LangGraph generates:
- `ai_run_id`: Unique cryptographic run UUID
- `request_id`: Client HTTP request identifier
- `conversation_id`: Active Copilot dialogue session
- `complaint_id`: Target complaint record
- `requested_model` vs `actual_model`
- `fallback_used` & `fallback_reason`
- `prompt_version` & semantic prompt snapshot
- `tokens_used` & `latency_ms`

## Consequences
- **Positive**: Complete auditability under 21 CFR Part 11; transparent fallback telemetry without false success claims.
- **Trade-off**: Additional database storage for input/output JSON payloads.
