# ADR 003: Robust Structured JSON Parsing with Reasoning Model Stripping

## Status
Accepted

## Context
Modern high-performance LLMs (e.g. `gemma2-9b-it`, `gpt-oss-20b`, `qwen3.6-27b`) frequently emit markdown code blocks, conversational preambles, or `<think>...</think>` internal reasoning tags that corrupt standard JSON parsers (`json.loads`).

## Decision
We implemented a multi-stage parser pipeline:
1. Regex stripping of `<think>` reasoning blocks.
2. Extraction of JSON substrings matching ````json ... ```` or outer `{ ... }` boundaries.
3. Schema and whitelist validation via `SafetyGate.validate_extracted_payload()`.
4. Fallback to deterministic regex-based QMS entity extraction upon parse or network failure.

## Alternatives Considered
1. **Relying solely on LLM native JSON mode (`response_format={"type": "json_object"}`)**:
   - *Why rejected*: Not all open-source models support native JSON constraints consistently, and reasoning models still embed thinking tags before emitting JSON.

## Trade-offs & Consequences
- **Pros**: 100% structured JSON extraction guarantee; zero unhandled JSON parsing exceptions reach the frontend or database.
- **Cons**: Requires dedicated regular expression hygiene and prompt tuning to maximize direct JSON compliance.
