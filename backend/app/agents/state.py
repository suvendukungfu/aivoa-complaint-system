from typing import TypedDict, Optional, List, Dict, Any

class StepAudit(TypedDict):
    step_name: str
    description: str
    status: str
    timestamp: str
    latency_ms: Optional[int]

class ModelMetadata(TypedDict, total=False):
    requested_model: str
    actual_model: str
    fallback_used: bool
    fallback_reason: Optional[str]
    latency_ms: int
    tokens_used: int
    prompt_version: str

class ComplaintAgentState(TypedDict, total=False):
    ai_run_id: str
    request_id: str
    conversation_id: str
    raw_input: str
    input_source: str  # "chat", "document"
    normalized_input: str
    safety_status: str  # "PASSED", "WARNING", "BLOCKED"
    extracted_data: Dict[str, Any]
    field_confidence: Dict[str, float]
    field_provenance: Dict[str, Dict[str, Any]]
    validation_errors: List[str]
    completeness: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommended_actions: List[str]
    final_complaint: Dict[str, Any]
    updated_fields: List[str]
    audit_trail: List[StepAudit]
    model_metadata: ModelMetadata
    prompt_version: str
    response_message: str
    error: Optional[str]

class EditAgentState(TypedDict, total=False):
    ai_run_id: str
    request_id: str
    conversation_id: str
    instruction: str
    current_complaint: Dict[str, Any]
    safety_status: str
    interpreted_changes: Dict[str, Any]
    changeset: Dict[str, Any]
    explanation: str
    should_recalculate_risk: bool
    final_complaint: Dict[str, Any]
    updated_fields: List[str]
    audit_trail: List[StepAudit]
    model_metadata: ModelMetadata
    prompt_version: str
    response_message: str
    error: Optional[str]
