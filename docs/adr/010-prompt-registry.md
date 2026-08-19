# ADR 010: Versioned Prompt Registry & Semantic Lifecycle

## Context
Hardcoding LLM prompt strings in disparate state machine nodes leads to unversioned mutations, untracked regressions, and inability to audit prompt evolution over time.

## Decision
We established a dedicated modular Prompt Registry located at `backend/app/agents/prompts/`:
- `extraction_v1.py`
- `edit_v1.py`
- `risk_v1.py`
- `completeness_v1.py`
- `summary_v1.py`
- `safety_v1.py`
- `__init__.py` (Semantic Prompt Registry mapping active versions to immutable definitions)

Every prompt maintains semantic versioning metadata (e.g. `v1.0`) recorded in `ai_runs` and audit events.

## Consequences
- **Positive**: Strict decoupling of prompts from execution logic; deterministic rollback capability; traceability in regulatory audits.
- **Trade-off**: Requires explicit registry updates for prompt iterations.
