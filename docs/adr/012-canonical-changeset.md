# ADR 012: Canonical ChangeSet Mutation Model & Invariant Preservation

## Context
When a user instructs the AI agent to modify a specific complaint field (e.g., "Change the affected quantity to 40 kg"), traditional LLM re-generation frequently corrupts or hallucinates untouched fields (such as batch numbers, customer names, or dates).

## Decision
We engineered a formal `ChangeSet` mutation architecture in `backend/app/agents/changeset.py`:
1. **Isolated Patch Extraction**: LLMs only output a sparse key-value delta dictionary (`changed_fields`).
2. **Schema & Safety Validation**: SafetyGate inspects all delta keys to reject unapproved fields.
3. **Atomic Merge**: Base state is strictly preserved; only verified delta keys are updated.
4. **Structured Diff Recording**: Before/after values are recorded as formal diffs (`previous_value`, `new_value`) in audit events.
5. **Sensitive Field Detection**: Changes to critical fields (`batch_number`, `product_name`, `severity`) flag `requires_approval = True`.

## Consequences
- **Positive**: 100% mathematical preservation rate on untouched fields; zero hallucinated data loss; transparent audit diffs.
- **Trade-off**: Requires dedicated patch validation logic before state transitions.
