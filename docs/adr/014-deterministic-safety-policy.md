# ADR 014: RiskPolicyEngine & Deterministic Regulatory Safety Floors

## Context
Quality risk management in pharmaceutical manufacturing follows ICH Q9 and US FDA guidance. While LLMs offer contextual understanding of nuanced defect descriptions, LLMs are probabilistic and may under-classify hazardous quality defects (such as sterility failures, endotoxin contamination, or wrong active pharmaceutical ingredient) as "Low" or "Medium" risk.

## Decision
We implemented a hard deterministic `RiskPolicyEngine` in `backend/app/agents/policy.py`:
1. **Safety Floors**: Explicit quality rules mandate minimum severity floors regardless of LLM recommendations:
   - Sterility / Microbial contamination / Anaphylaxis / Toxic impurities / Wrong active -> Floor: `Critical / Urgent`
   - Foreign particles / Black specks / Glass shards / Sub-potent assay / OOS dissolution / Broken drum seals -> Floor: `High / Urgent`
   - Chipped tablets / Packaging deformation / Barcode illegibility -> Floor: `Medium / Normal`
2. **Transparent Override Rationale**: If an LLM recommends a lower severity, the engine automatically escalates the rating and records an explicit audit adjustment explanation (e.g. `"AI severity 'Medium' escalated to policy floor 'High' due to particulate matter defect."`).

## Consequences
- **Positive**: Zero risk of critical safety under-classification; complete compliance with ICH Q9; auditable reasoning.
- **Trade-off**: Requires periodic regulatory review of defect keyword policy rules.
