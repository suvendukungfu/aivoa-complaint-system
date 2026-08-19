# ADR 011: Granular AI Feature Flags & Safe Operational Degradation

## Context
Deploying AI agents in production environments requires immediate circuit-breaker capabilities. If an external inference provider suffers an outage or unexpected behavior, operators must have the ability to toggle individual AI capabilities without redeploying the backend application.

## Decision
We implemented granular environment and runtime feature flags in `backend/app/core/config.py`:
- `AI_RISK_ASSESSMENT`: Enable/disable AI automated risk scoring
- `AI_DUPLICATE_DETECTION`: Enable/disable vector/lexical duplicate search
- `AI_SUMMARY`: Enable/disable natural-language executive summary generation
- `AI_COMPLETENESS`: Enable/disable QMS completeness evaluation
- `AI_DOCUMENT_EXTRACTION`: Enable/disable multi-format document OCR ingestion
- `AI_HUMAN_APPROVAL`: Enforce mandatory human QA confirmation on sensitive field modifications

## Consequences
- **Positive**: Instant incident mitigation; fine-grained runtime control; zero-downtime feature rollouts.
- **Trade-off**: Requires state machine branches to handle disabled feature paths gracefully.
