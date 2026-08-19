# ADR 005: Centralized Redux Toolkit State Management with Explicit Finite States

## Status
Accepted

## Context
The application coordinates bi-directional data flow between a 15-field structured form on the left and an AI Copilot chat on the right. When the AI extracts fields from unstructured text or applies partial edits, the form state must update reactively with highlighted fields, confidence metrics, and provenance badges.

## Decision
We implemented **Redux Toolkit** with normalized feature slices:
- `complaintSlice`: Manages active complaint form fields, dirty tracking, and updated field highlights.
- `aiSlice`: Manages chat messages, audit trails, risk triage cards, and an explicit finite state machine (`IDLE` ➔ `ANALYZING` ➔ `EXTRACTING` ➔ `VALIDATING` ➔ `ASSESSING_RISK` ➔ `UPDATING_FORM` ➔ `SUCCESS` / `ERROR`).
- `documentSlice`: Manages drag-and-drop file upload states and progress.
- `uiSlice`: Manages modals, drawers, and global notification toasts.

## Alternatives Considered
1. **React Context / useState Prop Drilling**:
   - *Why rejected*: Unnecessary re-rendering of the entire form when only a single field or chat message changes; lack of time-travel debugging and unified state reset capabilities.
2. **Zustand**:
   - *Why rejected*: Redux Toolkit is the enterprise industry standard and provides explicit reducer boundaries and typed selector hooks out of the box.

## Trade-offs & Consequences
- **Pros**: Predictable state transitions; single action (`setComplaintData`) synchronizes both the form and Copilot without component coupling; zero contradictory loading states.
- **Cons**: Minor boilerplate in action definitions and TypeScript typing compared to local state.
