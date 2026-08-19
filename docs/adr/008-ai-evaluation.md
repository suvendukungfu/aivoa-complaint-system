# ADR 008: Golden Dataset AI Evaluation Framework & Zero-Regression Quality Gates

## Context
In regulated pharmaceutical manufacturing (FDA 21 CFR Part 211 / EU Annex 11), AI systems assisting quality triage cannot rely on subjective prompt tweaking. LLM probabilistic variance threatens data integrity, risking unflagged critical defects or accidental field mutations.

## Decision
We implemented a dedicated golden dataset evaluation engine (`evaluation/`) with 90+ validated pharmaceutical scenarios spanning:
1. Multi-attribute entity extraction (20 cases)
2. Safe field merge & invariant preservation (20 cases)
3. Regulatory quality risk triage & severity floors (20 cases)
4. Adversarial prompt injection & red-team attacks (20 cases)
5. Multi-format document ingestion (10 cases)

The evaluation suite executes mathematical metrics (`field_exact_match_rate`, `untouched_field_preservation_rate`, `unauthorized_field_mutation_rate`, `prompt_injection_block_rate`) and acts as a strict CI blocker (`evaluation/runner.py`) failing any build with non-zero unauthorized field mutations.

## Consequences
- **Positive**: Empirical regression detection, verifiable compliance with FDA validation guidelines, zero hallucinated field overwrites.
- **Trade-off**: Requires maintaining golden test fixtures alongside product schema evolutions.
