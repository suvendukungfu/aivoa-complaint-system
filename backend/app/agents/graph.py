import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, START, END

from backend.app.agents.state import ComplaintAgentState, EditAgentState
from backend.app.agents.nodes import (
    input_normalization_node,
    complaint_extraction_node,
    field_validation_node,
    completeness_analysis_node,
    risk_assessment_node,
    state_merge_node,
    response_generation_node,
    interpret_edit_node,
    apply_changes_node,
    edit_response_node
)

logger = logging.getLogger(__name__)

# --- BUILD COMPLAINT EXTRACTION GRAPH ---
def build_complaint_graph():
    builder = StateGraph(ComplaintAgentState)
    
    # Register nodes
    builder.add_node("input_normalization", input_normalization_node)
    builder.add_node("complaint_extraction", complaint_extraction_node)
    builder.add_node("field_validation", field_validation_node)
    builder.add_node("completeness_analysis", completeness_analysis_node)
    builder.add_node("risk_assessment", risk_assessment_node)
    builder.add_node("state_merge", state_merge_node)
    builder.add_node("response_generation", response_generation_node)
    
    # Define linear pipeline transitions
    builder.add_edge(START, "input_normalization")
    builder.add_edge("input_normalization", "complaint_extraction")
    builder.add_edge("complaint_extraction", "field_validation")
    builder.add_edge("field_validation", "completeness_analysis")
    builder.add_edge("completeness_analysis", "risk_assessment")
    builder.add_edge("risk_assessment", "state_merge")
    builder.add_edge("state_merge", "response_generation")
    builder.add_edge("response_generation", END)
    
    return builder.compile()

# --- BUILD NATURAL LANGUAGE EDIT GRAPH ---
def build_edit_graph():
    builder = StateGraph(EditAgentState)
    
    # Register nodes
    builder.add_node("interpret_edit", interpret_edit_node)
    builder.add_node("apply_changes", apply_changes_node)
    builder.add_node("edit_response", edit_response_node)
    
    # Define transitions
    builder.add_edge(START, "interpret_edit")
    builder.add_edge("interpret_edit", "apply_changes")
    builder.add_edge("apply_changes", "edit_response")
    builder.add_edge("edit_response", END)
    
    return builder.compile()

# Pre-compile graphs
complaint_workflow = build_complaint_graph()
edit_workflow = build_edit_graph()

def run_complaint_pipeline(
    raw_text: str,
    source: str = "chat",
    pages: Any = None,
    document_filename: Any = None,
    ai_run_id: Any = None
) -> Dict[str, Any]:
    """Execute the full LangGraph complaint intake state machine"""
    initial_state: ComplaintAgentState = {
        "raw_input": raw_text,
        "input_source": source,
        "document_pages": pages,
        "document_filename": document_filename,
        "ai_run_id": ai_run_id,
        "audit_trail": []
    }
    
    final_state = complaint_workflow.invoke(initial_state)
    return final_state

def run_edit_pipeline(instruction: str, current_complaint: Dict[str, Any]) -> Dict[str, Any]:
    """Execute the LangGraph safe edit state machine"""
    initial_state: EditAgentState = {
        "instruction": instruction,
        "current_complaint": current_complaint,
        "audit_trail": []
    }
    
    final_state = edit_workflow.invoke(initial_state)
    return final_state
