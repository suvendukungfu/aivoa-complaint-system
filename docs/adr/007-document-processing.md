# ADR 007: Resilient Document Ingestion Pipeline with Security Sanitization

## Status
Accepted

## Context
Pharmaceutical complaint documentation arrives in diverse formats from email attachments, hospital incident reports, and certificates of analysis (PDF, DOCX, TXT, EML). File ingestion must prevent directory traversal attacks, validate MIME signatures, and extract tabular and nested body text.

## Decision
We implemented a dedicated **Document Processing Pipeline**:
1. **Filename Sanitization**: Normalizes path separators and strips double dots (`..`), null bytes, and path traversal tokens via `sanitize_filename()`.
2. **Format Parsers**:
   - `pypdf` for digital PDF vector text extraction.
   - `python-docx` for paragraphs and multi-column structured tables.
   - Standard library `email.policy.default` for EML email parsing with metadata headers (From, To, Date, Subject).
   - Multi-encoding TXT parser (UTF-8 with Latin-1 fallback).
3. **Payload Size Guard**: Hard 10 MB upload ceiling returning HTTP 413.

## Alternatives Considered
1. **Third-Party Commercial OCR / Unstructured.io API**:
   - *Why rejected*: Unnecessary cloud dependency for standard digital QA documents; introduces third-party privacy exposure and latency.

## Trade-offs & Consequences
- **Pros**: Fast in-memory parsing (<100ms); zero external OCR API costs; complete protection against file-based path traversal exploits.
- **Cons**: Scanned non-searchable image-only PDFs require upstream OCR before submission.
