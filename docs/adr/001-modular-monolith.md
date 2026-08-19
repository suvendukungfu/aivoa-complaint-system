# ADR 001: Modular Monolith vs. Microservices Architecture

## Status
Accepted

## Context
The AIVOA Pharmaceutical Complaint Management System requires coordinated interactions across HTTP transport, natural-language document extraction, LLM state machines, and relational persistence. During early architecture design, splitting the system into separate microservices (e.g. Intake Service, AI Worker, Persistence Service) was evaluated against a layered Modular Monolith.

## Decision
We chose a **Modular Monolith** architecture implemented in FastAPI and Python 3.12, organized into distinct bounded layers:
- `api/` — Transport and HTTP contract validation
- `services/` — Domain workflows and business orchestrations
- `repositories/` — Centralized database access abstraction
- `agents/` — LangGraph state machines, SafetyGates, and LLM inference
- `middleware/` & `observability/` — Request tracing, JSON logging, and telemetry

## Alternatives Considered
1. **Distributed Microservices with RabbitMQ/Kafka**:
   - *Why rejected*: Overengineering for current throughput; introduces distributed transaction complexity, network serialization latency, and complex local developer setup without measurable benefit.
2. **Serverless Lambda Functions**:
   - *Why rejected*: Cold start latency impairs real-time interactive chat UX; state machine orchestrations become fragmented across stateless lambdas.

## Trade-offs & Consequences
- **Pros**: Zero network serialization overhead between domain layers; atomic ACID database transactions across complaint creation and audit events; simplified local setup and zero-dependency CI.
- **Cons**: Requires strict discipline to prevent cross-layer coupling (enforced via repository boundaries and dependency injection).
