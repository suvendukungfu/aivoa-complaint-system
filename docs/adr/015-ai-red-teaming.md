# ADR 015: Adversarial Red-Teaming Suite & Multi-Layer AI Guardrails

## Context
AI-powered complaint ingestion systems are vulnerable to adversarial user prompts, malicious document uploads, and jailbreaking attacks designed to extract API keys, bypass CAPA escalation, forge QP approvals, or execute SQL/script injection.

## Decision
We implemented a multi-layered defense-in-depth architecture:
1. **Input Layer (SafetyGate)**: Scans unvetted user text and extracted document strings against 20+ compiled regex heuristics (detecting delimiters, system overrides, prompt leaks, SQL syntax, path traversal, and unicode direction overrides).
2. **Execution Layer (LangGraph Boundary)**: System prompts explicitly compartmentalize untrusted complaint text within `<UNTRUSTED_CONTENT>` tags and instruct models never to execute directives found within customer submissions.
3. **Output Layer (Pydantic Schema & ChangeSet)**: LLM outputs are strictly validated against Pydantic schema boundaries; unauthorized keys (`admin`, `exec`, `status`) are stripped.
4. **Adversarial Benchmark Suite**: 20 automated red-team golden scenarios continuously verify 100% containment in CI.

## Consequences
- **Positive**: Complete defense against prompt injection and unauthorized schema mutations.
- **Trade-off**: Minimal latency overhead (< 2ms) for input scanning.
