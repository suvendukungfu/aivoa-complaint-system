# ADR 002: LangGraph State Machine for Multi-Step AI Workflows

## Status
Accepted

## Context
Raw LLM calls (`prompt -> completion`) lack predictable state transitions, structured validation gates, and checkpointable audit trails needed in pharmaceutical quality management. When an LLM fails or returns incomplete output, traditional prompt chaining breaks completely.

## Decision
We implemented **LangGraph** `StateGraph` state machines for both Complaint Intake and Safe Natural-Language Edits:
- **Intake Pipeline**: `Input Normalization` ➔ `Groq AI Extraction` ➔ `Field Validation` ➔ `Completeness Analysis` ➔ `Risk Assessment` ➔ `State Merge` ➔ `Response Generation`.
- **Edit Pipeline**: `Interpret Edit Intent` ➔ `Safe Field Merge` ➔ `Edit Response`.

## Alternatives Considered
1. **Unstructured Single-Prompt LLM Call**:
   - *Why rejected*: High hallucination risk; cannot provide step-by-step auditability required by QMS standards.
2. **LangChain SequentialChain / LCEL**:
   - *Why rejected*: Inflexible branching, poor typed state management, and difficult inspection of intermediate step logs compared to LangGraph.

## Trade-offs & Consequences
- **Pros**: Every transition produces an immutable step audit entry with microsecond timestamps; deterministic fallback nodes can execute transparently if LLM output fails validation; state is strongly typed via `TypedDict`.
- **Cons**: Minor overhead in defining graph schemas and state transitions compared to direct API calls.
