# AIVOA Pharmaceutical Complaint Management System — Architecture

## 1. System Architecture Overview

The AIVOA Complaint Management System is an enterprise-grade AI-native quality assurance platform designed for pharmaceutical Active Pharmaceutical Ingredient (API) and Finished Dosage Form (FDF) manufacturing. It automates complaint intake, structured parameter extraction, natural language edits, and deterministic quality triage.

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React 19 + TypeScript + Vite)"]
        UI["Complaint Management View"]
        Redux["Redux Toolkit Central Store\n(complaintSlice, aiSlice, docSlice)"]
        Form["Log Customer Complaint Form\n(AI Highlight Glow & Badges)"]
        Copilot["AIVOA Co-pilot Panel\n(Chat, Ingestor, Risk, Completeness, Observability)"]
        
        UI --> Form
        UI --> Copilot
        Form <--> Redux
        Copilot <--> Redux
    end

    subgraph API["FastAPI Backend Layer (Python 3.12)"]
        Router["FastAPI REST Endpoints\n(/api/complaints/...)"]
        DocParser["Document Parsing Engine\n(PDF, DOCX, TXT, EML)"]
        DupEngine["Duplicate Detection Engine\n(Batch, Product, Type Overlap)"]
        CompService["Complaint Event Service\n(Audit Sourcing & Numbering)"]
    end

    subgraph Agent["AI Agent Layer (LangGraph + Groq)"]
        LG1["LangGraph Complaint Workflow\n(Normalized -> Extracted -> Validated -> Risk -> Merge)"]
        LG2["LangGraph Edit Workflow\n(Interpret -> Safe Field Merge -> Recalculate)"]
        Groq["Groq API Engine\n(gemma2-9b-it / llama-3.3-70b-versatile)"]
        DetFallback["Deterministic QMS Quality Rules\n(Safety & Compliance Enforcement)"]
    end

    subgraph Storage["Database Layer"]
        PG[("PostgreSQL Database\n(complaints, events, docs)")]
        SQLite[("SQLite Auto-Fallback Engine\n(Zero-friction local dev)")]
    end

    Client -- "REST API (JSON / Multipart)" --> Router
    Router --> DocParser
    Router --> LG1
    Router --> LG2
    LG1 <--> Groq
    LG1 <--> DetFallback
    LG2 <--> Groq
    LG2 <--> DetFallback
    Router --> DupEngine
    Router --> CompService
    CompService --> PG
    CompService -.-> SQLite
```

---

## 2. End-to-End Data Flow

1. **Intake / Ingestion**: User inputs natural language text via chat or uploads a complaint document (`PDF`, `DOCX`, `TXT`, `EML` up to 10 MB).
2. **Text Normalization**: Document parser extracts raw text; LangGraph normalizes whitespace, formats dates, and initializes audit metadata.
3. **Structured Extraction**: LangGraph dispatches prompts to Groq running `gemma2-9b-it` (with fallback to `llama-3.3-70b-versatile` or deterministic rules).
4. **Validation & Quality Triage**: Extracted parameters are validated against standard pharmaceutical QMS dictionaries.
5. **Deterministic Risk Assessment**: Safety rules evaluate indicators (foreign particles, black specks, sterility, OOS assay) to classify Severity (`Low`, `Medium`, `High`, `Critical`) and Priority (`Low`, `Normal`, `High`, `Urgent`).
6. **Completeness Audit**: QMS completeness score (0-100%) is calculated, highlighting missing critical vs. optional fields.
7. **Redux Dispatch**: Structured JSON response updates Redux store, triggering live visual glow pulses and "✨ AI updated" badges on modified form fields.
8. **QMS Persistence**: When the user clicks "Save Complaint", a standardized sequential ID (`CMP-2026-XXXX`) is assigned, persisting the record and event logs to PostgreSQL.

---

## 3. LangGraph State Machine Workflows

### 3.1 Complaint Intake Graph (`complaint_workflow`)
```mermaid
stateDiagram-v2
    [*] --> input_normalization
    input_normalization --> complaint_extraction
    complaint_extraction --> field_validation
    field_validation --> completeness_analysis
    completeness_analysis --> risk_assessment
    risk_assessment --> state_merge
    state_merge --> response_generation
    response_generation --> [*]
```

### 3.2 Natural-Language Edit Graph (`edit_workflow`)
The edit workflow enforces strict **safe merge semantics**: only the target fields specified by the user are modified; all other fields are 100% preserved.

```mermaid
stateDiagram-v2
    [*] --> interpret_edit
    interpret_edit --> apply_changes
    note right of apply_changes
      1. Clone existing complaint state
      2. Apply diff only to specified keys
      3. Preserve untouched product, batch, and dates
      4. Recalculate completeness & risk if needed
    end note
    apply_changes --> edit_response
    edit_response --> [*]
```

---

## 4. Redux Store State Hierarchy

Redux Toolkit acts as the single source of truth for the frontend application:

```text
RootState
├── complaint: ComplaintState
│   ├── data: ComplaintData (source, customer, product, batch, dates, quantity, description, severity, priority)
│   ├── updatedFields: string[] (tracks recently modified fields for UI highlight animation)
│   ├── lastSaved: SaveComplaintResponse | null
│   └── isSaved: boolean
│
├── ai: AIState
│   ├── messages: ChatMessage[] (chat history with rich markdown formatting)
│   ├── loading: boolean
│   ├── statusText: string (e.g. "Extracting entities...", "Assessing risk...")
│   ├── auditTrail: StepAuditLog[] (LangGraph node-by-node execution logs)
│   ├── riskAssessment: RiskAssessment | null
│   ├── completeness: CompletenessAssessment | null
│   ├── duplicateWarning: DuplicateMatch | null
│   └── isObservabilityOpen: boolean
│
├── document: DocumentState
│   ├── isDragging: boolean
│   ├── uploading: boolean
│   ├── progress: number (0-100)
│   ├── currentFile: { name, size, type } | null
│   └── error: string | null
│
└── ui: UIState
    ├── showSavedModal: boolean
    ├── savedComplaintsList: HistoricalComplaint[]
    ├── selectedComplaintDetail: HistoricalComplaint | null
    └── toast: { type, message } | null
```

---

## 5. PostgreSQL Database Schema

```mermaid
erDiagram
    COMPLAINTS ||--o{ COMPLAINT_EVENTS : "tracks"
    COMPLAINTS ||--o{ COMPLAINT_DOCUMENTS : "contains"

    COMPLAINTS {
        int id PK
        string complaint_number UK "e.g. CMP-2026-0001"
        string complaint_source
        string customer_name
        string product_name
        string product_strength
        string batch_number
        string manufacturing_date
        string expiry_date
        string quantity_affected
        string quantity_unit
        string complaint_type
        string complaint_date
        text detailed_description
        string severity "Low | Medium | High | Critical"
        string priority "Low | Normal | High | Urgent"
        float ai_confidence
        text ai_reasoning
        json recommended_actions
        float completeness_score
        json field_confidence
        string status "Pending Triage | Under Investigation"
        datetime created_at
        datetime updated_at
    }

    COMPLAINT_EVENTS {
        int id PK
        int complaint_id FK
        string event_type "COMPLAINT_CREATED | AI_EDIT | RISK_RECALCULATED"
        text input_text
        json structured_changes
        datetime created_at
    }

    COMPLAINT_DOCUMENTS {
        int id PK
        int complaint_id FK
        string filename
        string content_type
        int file_size
        text extracted_text
        datetime uploaded_at
    }
```
