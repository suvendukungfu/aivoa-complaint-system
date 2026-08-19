# ADR 004: PostgreSQL 16 with Alembic Migrations and SQLite Resilience

## Status
Accepted

## Context
Pharmaceutical customer complaint management requires strict relational integrity, indexed batch/lot searches, foreign-key relationships to immutable audit events, and schema migration management across staging and production.

## Decision
We standardized on **PostgreSQL 16** via `SQLAlchemy 2.0` and `psycopg 3`, managed with **Alembic** migrations. For zero-config developer convenience and offline environments where PostgreSQL containers are inactive, the database engine transparently falls back to `sqlite:///./complaints.db`.

## Alternatives Considered
1. **MongoDB / NoSQL Document Store**:
   - *Why rejected*: Lacks native ACID table constraints, cascade delete protections, and structured foreign-key indexing required by QMS audit logging standards.
2. **Pure SQLite Only**:
   - *Why rejected*: Unsuitable for concurrent production writes and multi-user enterprise deployments.

## Trade-offs & Consequences
- **Pros**: Composite indexing on `(product_name, batch_number)` and `(status, severity)` guarantees sub-millisecond query performance; atomic transactions guarantee zero partially saved records; Alembic maintains clear schema evolution history.
- **Cons**: Dual-engine support requires maintaining cross-compatible SQL dialect constraints (e.g. `render_as_batch=True` in Alembic for SQLite).
