# ADR 006: AI Safety Gates, Prompt Injection Defense, and Safe Field Merges

## Status
Accepted

## Context
In enterprise AI deployments, LLMs cannot be trusted to directly mutate database state or interpret untrusted user files without safety guardrails. Adversarial document contents (e.g. *"Ignore previous instructions..."*) or unauthorized payload keys (e.g. `delete_database: true`) represent severe operational risks.

## Decision
We implemented a multi-layered **Safety Gate**:
1. **Prompt Injection Defense**: System prompts explicitly designate all user and document text as untrusted data (`<UNTRUSTED_DATA>`); input normalization scans for injection keywords before inference.
2. **Schema Whitelisting**: Strict dictionary validation discards any payload key not explicitly present in `ALLOWED_COMPLAINT_FIELDS`.
3. **Safe Field Merge**: Natural-language edits return only a patch dictionary of changed keys, guaranteeing that 100% of untouched fields (batch, customer, product, dates) remain strictly preserved.
4. **Deterministic Risk Safety Floor**: High-risk defect categories (sterility, toxic contamination, wrong strength) enforce an immutable safety severity floor (`Critical / Urgent`).

## Alternatives Considered
1. **Total Replacement on Edit**:
   - *Why rejected*: Re-generating the entire complaint record during an edit frequently hallucinations untouched fields (e.g. altering the batch number when only the quantity was requested to change).

## Trade-offs & Consequences
- **Pros**: 100% edit preservation invariant across all benchmark tests; complete immunity to prompt injection command executions; strict QMS enum conformance.
- **Cons**: Requires continuous maintenance of the allowed field whitelist as new domain fields are introduced.
