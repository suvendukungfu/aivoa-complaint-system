# ADR 013: Immutable QMS Audit Trail & Actor Attribution

## Context
FDA 21 CFR Part 11 mandates secure, computer-generated, time-stamped audit trails to independently record the date and time of operator entries and actions that create, modify, or delete electronic records.

## Decision
We established an immutable event ledger via the `complaint_events` database entity:
- Every event records `event_type`, `actor` (e.g. `qa_analyst`, `aivoa_copilot`), `actor_type` (`HUMAN` vs `AI`), `ai_run_id`, `structured_changes`, and field `diffs`.
- Composite indexing on `(complaint_id, created_at)` enables rapid chronological reconstruction.
- Direct database updates to past event records are disallowed by repository constraints.

## Consequences
- **Positive**: Strict regulatory compliance; non-repudiation of AI actions; complete lineage reconstruction.
- **Trade-off**: Append-only event logs grow linearly with complaint revisions.
