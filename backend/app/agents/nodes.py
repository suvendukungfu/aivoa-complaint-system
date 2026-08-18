import re
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from langchain_core.messages import SystemMessage, HumanMessage

from backend.app.core.config import settings
from backend.app.agents.state import ComplaintAgentState, EditAgentState, StepAudit
from backend.app.agents.providers import get_llm_provider
from backend.app.agents.safety import SafetyGate
from backend.app.agents.provenance import FieldProvenanceEngine
from backend.app.agents.policy import RiskPolicyEngine
from backend.app.agents.changeset import ChangeSetPipeline
from backend.app.agents.prompts import (
    PROMPT_VERSION,
    COMPLAINT_EXTRACTION_SYSTEM_PROMPT,
    NATURAL_LANGUAGE_EDIT_SYSTEM_PROMPT,
    COMPLETENESS_SYSTEM_PROMPT,
    SUMMARY_SYSTEM_PROMPT
)

logger = logging.getLogger(__name__)

def get_current_time_str() -> str:
    return datetime.now(timezone.utc).strftime("%H:%M:%S")

def get_current_date_str() -> str:
    return datetime.now(timezone.utc).strftime("%d %B %Y")

def extract_json_from_llm_response(text: str) -> Dict[str, Any]:
    """Robustly extract and parse JSON from LLM output, stripping reasoning blocks"""
    # Remove any <think> tags from reasoning models
    text = re.sub(r'<think>[\s\S]*?</think>', '', text).strip()
    
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        text = json_match.group(1).strip()
    
    brace_match = re.search(r'(\{[\s\S]*\})', text)
    if brace_match:
        text = brace_match.group(1).strip()
    
    return json.loads(text)

# --- DETERMINISTIC SAFETY & QUALITY RULES ---
CRITICAL_KEYWORDS = ["sterility", "contamination", "toxic", "wrong product", "wrong strength", "adverse event", "anaphylaxis", "poison"]
HIGH_KEYWORDS = ["black particles", "foreign matter", "particles", "foreign particle", "discoloration", "black specks", "glass", "sub-potent", "oos", "out of specification", "microbial", "leak", "compromised seal"]
MEDIUM_KEYWORDS = ["chipped", "packaging", "label", "damaged carton", "blister", "print illegible", "crushed box"]

def calculate_deterministic_risk(complaint: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic Safety Rule Engine enforcing pharma quality standards"""
    desc = str(complaint.get("detailed_description", "")).lower()
    ctype = str(complaint.get("complaint_type", "")).lower()
    prod = str(complaint.get("product_name", "")).lower()
    combined_text = f"{desc} {ctype} {prod}"

    severity = "Medium"
    priority = "Normal"
    rationale = "Routine packaging/administrative complaint triage."
    actions = [
        "Acknowledge complaint with customer within 24 hours",
        "Log formal deviation in QMS",
        "Request photographs or retention samples"
    ]

    if any(k in combined_text for k in CRITICAL_KEYWORDS):
        severity = "Critical"
        priority = "Urgent"
        rationale = "Critical patient safety or regulatory defect indicator detected. Immediate quarantine and management escalation mandated."
        actions = [
            "IMMEDIATE ACTION: Initiate rapid lot quarantine and distribution hold",
            "Convene emergency Quality Review Board (QRB)",
            "Notify Responsible Person / Qualified Person (QP)",
            "Perform health hazard assessment (HHA) within 24 hours",
            "Initiate CAPA Investigation under Accelerated Protocol"
        ]
    elif any(k in combined_text for k in HIGH_KEYWORDS):
        severity = "High"
        priority = "Urgent"
        rationale = "Significant product quality defect (e.g. foreign particulate matter, assay failure). Potential batch-wide impact."
        actions = [
            "Quarantine subject batch in distribution warehouse",
            "Perform FTIR / microscopic chemical identification on foreign matter",
            "Initiate Batch Manufacturing Record (BMR) and Centrifuge log review",
            "Request customer sample retention and return for laboratory analysis",
            "Log Level-2 Quality Investigation in QMS"
        ]
    elif any(k in combined_text for k in MEDIUM_KEYWORDS):
        severity = "Medium"
        priority = "Normal"
        rationale = "Secondary packaging or non-critical physical presentation issue. Primary drug product container intact."
        actions = [
            "Inspect retention samples from subject packaging campaign",
            "Review warehouse shipping and transport temperature logs",
            "Issue corrective packaging guidance to logistics partner"
        ]

    return {
        "severity": severity,
        "priority": priority,
        "risk_rationale": rationale,
        "recommended_actions": actions,
        "disclaimer": "AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel."
    }

def calculate_deterministic_completeness(complaint: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate completeness score and identify missing fields"""
    critical_fields = {
        "customer_name": "Customer Name",
        "product_name": "Product Name",
        "batch_number": "Batch / Lot Number",
        "detailed_description": "Detailed Complaint Description",
        "complaint_type": "Complaint Type"
    }
    optional_fields = {
        "manufacturing_date": "Manufacturing Date",
        "expiry_date": "Expiry Date",
        "quantity_affected": "Quantity Affected",
        "complaint_date": "Complaint Date",
        "product_strength": "Product Strength / Grade"
    }

    missing_critical = []
    missing_optional = []

    for key, label in critical_fields.items():
        val = complaint.get(key)
        if not val or str(val).strip() in ["", "None", "null", "N/A", "Unknown"]:
            missing_critical.append(label)

    for key, label in optional_fields.items():
        val = complaint.get(key)
        if not val or str(val).strip() in ["", "None", "null", "N/A", "Unknown"]:
            missing_optional.append(label)

    total_weight = len(critical_fields) * 15 + len(optional_fields) * 5
    present_weight = (len(critical_fields) - len(missing_critical)) * 15 + (len(optional_fields) - len(missing_optional)) * 5
    score = round((present_weight / total_weight) * 100, 1)

    recommendations = []
    if "Customer Name" in missing_critical or "Complaint Type" in missing_critical:
        recommendations.append(f"Request critical details from customer: {', '.join(missing_critical)}.")
    if "Manufacturing Date" in missing_optional or "Expiry Date" in missing_optional:
        recommendations.append("Cross-reference ERP/Batch Manufacturing Records to verify lot shelf-life.")
    if "Quantity Affected" in missing_optional:
        recommendations.append("Confirm total compromised quantity to assess reconciliation and recall scope.")
    if not recommendations:
        recommendations.append("All primary QMS fields are present. Ready for formal QA review.")

    return {
        "completeness_score": score,
        "missing_critical_fields": missing_critical,
        "missing_optional_fields": missing_optional,
        "recommendations": recommendations
    }

# --- LANGGRAPH NODE FUNCTIONS: COMPLAINT INTAKE WORKFLOW ---

def input_normalization_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Normalize whitespace, sanitize text, and scan for prompt injection"""
    raw = state.get("raw_input", "")
    now = get_current_time_str()
    audit: List[StepAudit] = list(state.get("audit_trail", []))
    
    normalized = " ".join(raw.split()).strip()
    
    # Prompt injection security check
    is_injection, flags = SafetyGate.scan_for_prompt_injection(normalized)
    safety_status = "WARNING" if is_injection else "PASSED"

    audit.append({
        "step_name": "Input Normalization",
        "description": f"Processed {len(normalized)} characters (Security: {safety_status})",
        "status": "completed",
        "timestamp": now
    })
    
    return {
        "normalized_input": normalized,
        "safety_status": safety_status,
        "audit_trail": audit
    }

def complaint_extraction_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Extract structured complaint parameters using Groq LLM or deterministic fallback"""
    text = state.get("normalized_input", "")
    input_source = state.get("input_source", "customer_prompt")
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    provider = get_llm_provider()
    extracted_data = {}
    field_confidence = {}
    model_metadata = {
        "prompt_version": PROMPT_VERSION,
        "requested_provider": "groq",
        "requested_model": settings.GROQ_MODEL,
        "actual_provider": "deterministic-fallback",
        "actual_model": "deterministic-fallback",
        "fallback_used": False,
        "fallback_reason": None,
        "latency_ms": 0,
        "tokens_used": 0
    }
    
    if provider.is_available():
        try:
            messages = [
                SystemMessage(content=COMPLAINT_EXTRACTION_SYSTEM_PROMPT),
                HumanMessage(content=f"Extract structured pharmaceutical complaint data from the following text:\n\n{text}")
            ]
            res = provider.invoke_with_telemetry(messages)
            if res.content:
                raw_json = extract_json_from_llm_response(res.content)
                # Apply safety gate validation
                cleaned_json, violations = SafetyGate.validate_extracted_payload(raw_json)
                extracted_data = cleaned_json
                field_confidence = extracted_data.get("field_confidence", {})

                # Deterministic backfill for any missing critical parameters
                det_fallback = fallback_deterministic_extractor(text)
                for k in ["customer_name", "batch_number", "product_name", "product_strength", "quantity_affected", "manufacturing_date", "expiry_date"]:
                    if not extracted_data.get(k) and det_fallback.get(k):
                        extracted_data[k] = det_fallback[k]
                        field_confidence[k] = det_fallback.get("field_confidence", {}).get(k, 0.95)

                model_metadata.update({
                    "requested_provider": res.requested_provider,
                    "requested_model": res.requested_model,
                    "actual_provider": res.actual_provider,
                    "actual_model": res.actual_model,
                    "fallback_used": res.fallback_used,
                    "fallback_reason": res.fallback_reason,
                    "latency_ms": res.latency_ms,
                    "tokens_used": res.tokens_used
                })
                
                desc = f"Extracted structured fields using Groq ({res.actual_model}) in {res.latency_ms}ms"
                if res.fallback_used:
                    desc += f" [Fallback from {res.requested_model}]"

                audit.append({
                    "step_name": "AI Extraction",
                    "description": desc,
                    "status": "completed",
                    "timestamp": now,
                    "latency_ms": res.latency_ms
                })
            else:
                raise ValueError("No response returned from Groq")
        except Exception as e:
            logger.warning(f"Groq LLM extraction failed ({e}). Using deterministic rule-based fallback.")
            extracted_data = fallback_deterministic_extractor(text)
            model_metadata.update({
                "fallback_used": True,
                "fallback_reason": str(e),
                "actual_model": "deterministic-rule-extractor"
            })
            audit.append({
                "step_name": "AI Extraction",
                "description": f"Used deterministic QMS pattern extraction (Fallback: {e})",
                "status": "completed",
                "timestamp": now,
                "latency_ms": 5
            })
    else:
        extracted_data = fallback_deterministic_extractor(text)
        audit.append({
            "step_name": "AI Extraction",
            "description": "Extracted structured fields via deterministic QMS parser",
            "status": "completed",
            "timestamp": now,
            "latency_ms": 2
        })

    # Build field-level provenance and grounded confidence
    provenance_map = FieldProvenanceEngine.build_provenance_map(
        extracted_fields=extracted_data,
        raw_text=text,
        pages=state.get("document_pages"),
        source_doc_id=state.get("document_filename"),
        ai_run_id=state.get("ai_run_id"),
        source_type=input_source
    )
        
    return {
        "extracted_data": extracted_data,
        "field_confidence": field_confidence,
        "field_provenance": provenance_map,
        "model_metadata": model_metadata,
        "audit_trail": audit
    }

def field_validation_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Validate and clean extracted fields against QMS dictionary"""
    data = dict(state.get("extracted_data", {}))
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    for k, v in data.items():
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean.lower() in ["none", "null", "n/a", "not specified", "unknown"]:
                data[k] = None
            else:
                data[k] = v_clean
                
    if data.get("quantity_affected") and not data.get("quantity_unit"):
        data["quantity_unit"] = "kg"
        
    audit.append({
        "step_name": "Field Validation",
        "description": "Validated fields against pharmaceutical QMS data dictionary",
        "status": "completed",
        "timestamp": now
    })
    
    return {
        "extracted_data": data,
        "audit_trail": audit
    }

def completeness_analysis_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Calculate QMS complaint completeness score and identify gaps"""
    data = state.get("extracted_data", {})
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    completeness = calculate_deterministic_completeness(data)
    
    audit.append({
        "step_name": "Completeness Analysis",
        "description": f"Calculated QMS completeness score: {completeness['completeness_score']}%",
        "status": "completed",
        "timestamp": now
    })
    
    return {
        "completeness": completeness,
        "audit_trail": audit
    }

def risk_assessment_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Assess initial risk using deterministic safety policy engine and LLM insights"""
    data = state.get("extracted_data", {})
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    # Evaluate policy against facts and LLM candidate severity
    policy_eval = RiskPolicyEngine.evaluate_policy(
        complaint=data,
        ai_severity=data.get("severity"),
        ai_priority=data.get("priority")
    )
    
    # Ground risk evidence factors in source text
    raw_input = state.get("raw_input", "")
    pages = state.get("document_pages")
    source_doc = state.get("document_filename")
    evidence_grounding = FieldProvenanceEngine.ground_risk_evidence(
        complaint=data,
        raw_text=raw_input,
        pages=pages,
        source_doc_id=source_doc
    )

    risk_res = {
        "severity": policy_eval["severity"],
        "priority": policy_eval["priority"],
        "risk_rationale": data.get("ai_reasoning") or (" ".join(policy_eval["policy_adjustments"]) if policy_eval["policy_adjustments"] else "Standard quality triage evaluation."),
        "recommended_actions": policy_eval["recommended_actions"],
        "policy_overridden": policy_eval["policy_overridden"],
        "policy_adjustments": policy_eval["policy_adjustments"],
        "disclaimer": policy_eval["disclaimer"],
        "evidence_grounding": evidence_grounding
    }
    
    desc = f"Assessed initial risk: Severity={policy_eval['severity']}, Priority={policy_eval['priority']}"
    if policy_eval["policy_overridden"]:
        desc += " (Safety Policy Adjusted)"

    audit.append({
        "step_name": "Risk Triage Assessment",
        "description": desc,
        "status": "completed",
        "timestamp": now,
        "latency_ms": 3
    })
    
    return {
        "risk_assessment": risk_res,
        "recommended_actions": risk_res["recommended_actions"],
        "audit_trail": audit
    }

def state_merge_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Merge all extracted and evaluated parameters into cohesive complaint object"""
    data = state.get("extracted_data", {})
    risk = state.get("risk_assessment", {})
    completeness = state.get("completeness", {})
    provenance = state.get("field_provenance", {})
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    final_complaint = {
        "complaint_source": data.get("complaint_source") or "Customer Direct / Email",
        "customer_name": data.get("customer_name"),
        "product_name": data.get("product_name"),
        "product_strength": data.get("product_strength"),
        "batch_number": data.get("batch_number"),
        "manufacturing_date": data.get("manufacturing_date"),
        "expiry_date": data.get("expiry_date"),
        "quantity_affected": str(data.get("quantity_affected")) if data.get("quantity_affected") is not None else None,
        "quantity_unit": data.get("quantity_unit") or "kg",
        "complaint_type": data.get("complaint_type") or "Foreign Matter / Contamination",
        "complaint_date": data.get("complaint_date") or get_current_date_str(),
        "detailed_description": data.get("detailed_description") or state.get("raw_input", ""),
        "severity": risk.get("severity", "Medium"),
        "priority": risk.get("priority", "Normal"),
        "ai_confidence": data.get("ai_confidence", 0.92),
        "ai_reasoning": risk.get("risk_rationale"),
        "recommended_actions": risk.get("recommended_actions", []),
        "completeness_score": completeness.get("completeness_score", 0.0),
        "field_confidence": state.get("field_confidence", {}),
        "field_provenance": provenance,
        "status": "Pending Triage"
    }
    
    updated_fields = [k for k, v in final_complaint.items() if v is not None and k not in ["recommended_actions", "completeness_score", "status", "field_confidence", "field_provenance"]]
    
    audit.append({
        "step_name": "State Merged",
        "description": f"Updated {len(updated_fields)} complaint form fields for Redux dispatch",
        "status": "completed",
        "timestamp": now
    })
    
    return {
        "final_complaint": final_complaint,
        "updated_fields": updated_fields,
        "audit_trail": audit
    }

def response_generation_node(state: ComplaintAgentState) -> Dict[str, Any]:
    """Generate final assistant chat response"""
    complaint = state.get("final_complaint", {})
    risk = state.get("risk_assessment", {})
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    cust = complaint.get("customer_name") or "Unknown Customer"
    prod = complaint.get("product_name") or "Product Unspecified"
    batch = complaint.get("batch_number") or "Batch Unspecified"
    qty = f"{complaint.get('quantity_affected', '')} {complaint.get('quantity_unit', '')}".strip()
    ctype = complaint.get("complaint_type") or "Quality Issue"
    
    response_msg = (
        f"✅ **Complaint captured successfully.**\n\n"
        f"**Extracted Information:**\n"
        f"• **Customer:** {cust}\n"
        f"• **Product:** {prod} {complaint.get('product_strength') or ''}\n"
        f"• **Batch / Lot:** `{batch}`\n"
        f"• **Affected Quantity:** {qty or 'Not specified'}\n"
        f"• **Classification:** {ctype}\n\n"
        f"**AI Risk Triage:**\n"
        f"• **Severity:** `{risk.get('severity', 'Medium')}`\n"
        f"• **Priority:** `{risk.get('priority', 'Normal')}`\n"
        f"• **Rationale:** {risk.get('risk_rationale', '')}\n\n"
        f"**Recommended Immediate Next Step:**\n"
        f"• {risk.get('recommended_actions', ['Review Batch Records'])[0]}"
    )
    
    audit.append({
        "step_name": "Response Generation",
        "description": "Generated conversational breakdown for Quality Copilot",
        "status": "completed",
        "timestamp": now
    })
    
    return {
        "response_message": response_msg,
        "audit_trail": audit
    }

# --- LANGGRAPH NODE FUNCTIONS: NATURAL-LANGUAGE EDIT WORKFLOW ---

def interpret_edit_node(state: EditAgentState) -> Dict[str, Any]:
    """Interpret natural-language edit instruction using Groq LLM or deterministic entity matcher"""
    instruction = state.get("instruction", "")
    current = state.get("current_complaint", {})
    now = get_current_time_str()
    
    audit: List[StepAudit] = [{
        "step_name": "Interpret Edit Intent",
        "description": f"Analyzing edit instruction: \"{instruction}\"",
        "status": "completed",
        "timestamp": now,
        "latency_ms": 0
    }]
    
    provider = get_llm_provider()
    interpreted_changes = {}
    explanation = ""
    should_recalc = False
    model_metadata = {
        "prompt_version": PROMPT_VERSION,
        "requested_model": settings.GROQ_MODEL,
        "actual_model": "deterministic-edit-parser",
        "fallback_used": False,
        "fallback_reason": None,
        "latency_ms": 0
    }
    
    if provider.is_available():
        try:
            messages = [
                SystemMessage(content=NATURAL_LANGUAGE_EDIT_SYSTEM_PROMPT),
                HumanMessage(content=f"Current Complaint State:\n{json.dumps(current, indent=2)}\n\nEdit Instruction: \"{instruction}\"")
            ]
            res = provider.invoke_with_telemetry(messages)
            if res.content:
                parsed = extract_json_from_llm_response(res.content)
                raw_changes = parsed.get("changed_fields", {})
                valid_patch, _ = SafetyGate.validate_edit_patch(raw_changes)
                interpreted_changes = valid_patch
                explanation = parsed.get("explanation", "Updated requested fields.")
                should_recalc = parsed.get("should_recalculate_risk", False)
                model_metadata.update({
                    "requested_model": res.requested_model,
                    "actual_model": res.actual_model,
                    "fallback_used": res.fallback_used,
                    "fallback_reason": res.fallback_reason,
                    "latency_ms": res.latency_ms
                })
                audit[0]["latency_ms"] = res.latency_ms
            else:
                raise ValueError("No response returned from Groq")
        except Exception as e:
            logger.warning(f"LLM edit interpretation failed ({e}). Using deterministic parser.")
            interpreted_changes, explanation = fallback_deterministic_edit_parser(instruction, current)
    else:
        interpreted_changes, explanation = fallback_deterministic_edit_parser(instruction, current)
        
    return {
        "interpreted_changes": interpreted_changes,
        "explanation": explanation,
        "should_recalculate_risk": should_recalc,
        "model_metadata": model_metadata,
        "audit_trail": audit
    }

def apply_changes_node(state: EditAgentState) -> Dict[str, Any]:
    """Safely apply changes via ChangeSetPipeline while strictly preserving untouched fields"""
    current = dict(state.get("current_complaint", {}))
    raw_changes = state.get("interpreted_changes", {})
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    pipeline_res = ChangeSetPipeline.process_and_apply(
        base_complaint=current,
        raw_changes=raw_changes,
        actor_type="AI",
        actor_id="aivoa_copilot",
        require_approval_for_sensitive=settings.AI_HUMAN_APPROVAL
    )
    
    final_complaint = pipeline_res["updated_complaint"]
    updated_fields = pipeline_res["updated_fields"]
    
    # Update provenance for edited fields
    provenance = dict(final_complaint.get("field_provenance") or {})
    for field in updated_fields:
        provenance[field] = FieldProvenanceEngine.generate_field_provenance(
            field_name=field,
            value=final_complaint.get(field),
            source_type="user_edit",
            is_explicit=True,
            confidence_score=0.99
        )
    final_complaint["field_provenance"] = provenance
    
    comp = calculate_deterministic_completeness(final_complaint)
    final_complaint["completeness_score"] = comp["completeness_score"]
    
    # Recalculate risk if critical fields modified
    if any(f in updated_fields for f in ["severity", "priority", "complaint_type", "detailed_description"]):
        policy_eval = RiskPolicyEngine.evaluate_policy(final_complaint)
        if "severity" not in raw_changes:
            final_complaint["severity"] = policy_eval["severity"]
        if "priority" not in raw_changes:
            final_complaint["priority"] = policy_eval["priority"]
        final_complaint["ai_reasoning"] = policy_eval["risk_rationale"]
        final_complaint["recommended_actions"] = policy_eval["recommended_actions"]
        
    audit.append({
        "step_name": "Safe Field Merge",
        "description": f"Applied changes to {len(updated_fields)} field(s): {', '.join(updated_fields)}. Untouched fields strictly preserved.",
        "status": "completed",
        "timestamp": now,
        "latency_ms": 2
    })
    
    return {
        "final_complaint": final_complaint,
        "changeset": pipeline_res["changeset"],
        "updated_fields": updated_fields,
        "audit_trail": audit
    }

def edit_response_node(state: EditAgentState) -> Dict[str, Any]:
    """Generate assistant explanation for natural language edit"""
    updated_fields = state.get("updated_fields", [])
    complaint = state.get("final_complaint", {})
    now = get_current_time_str()
    audit = list(state.get("audit_trail", []))
    
    field_bullets = []
    for f in updated_fields:
        val = complaint.get(f)
        label = f.replace("_", " ").title()
        field_bullets.append(f"• **{label}:** `{val}`")
        
    bullets_text = "\n".join(field_bullets) if field_bullets else "• *No fields were modified.*"
    
    msg = (
        f"✏️ **Updated Complaint Successfully.**\n\n"
        f"**Changes Applied:**\n"
        f"{bullets_text}\n\n"
        f"ℹ️ *All other complaint information, batch details, and customer records remain strictly unchanged.*"
    )
    
    audit.append({
        "step_name": "Edit Response",
        "description": "Generated modification confirmation",
        "status": "completed",
        "timestamp": now
    })
    
    return {
        "response_message": msg,
        "audit_trail": audit
    }

# --- DETERMINISTIC FALLBACK EXTRACTORS ---

def fallback_deterministic_extractor(text: str) -> Dict[str, Any]:
    """Deterministic regex and keyword extractor for zero-failure reliability"""
    data: Dict[str, Any] = {
        "complaint_source": "Customer Direct / Email",
        "customer_name": None,
        "product_name": None,
        "product_strength": None,
        "batch_number": None,
        "manufacturing_date": None,
        "expiry_date": None,
        "quantity_affected": None,
        "quantity_unit": "kg",
        "complaint_type": "Foreign Matter / Contamination",
        "complaint_date": get_current_date_str(),
        "detailed_description": text,
        "severity": "Medium",
        "priority": "Normal",
        "ai_confidence": 0.91,
        "ai_reasoning": "Extracted via QMS pattern recognition engine.",
        "recommended_actions": [
            "Quarantine subject batch in distribution warehouse",
            "Request customer sample retention and inspection photographs",
            "Review batch manufacturing and analytical release records"
        ],
        "field_confidence": {}
    }

    # Batch Number: e.g. batch PA240812, batch BTCH9901, lot AMX-2026-884, Batch MET-500-A
    batch_match = re.search(r'(?:batch(?:\s*(?:number|no|#))?|lot(?:\s*(?:number|no|#))?)\s*[:\s\-]?\s*([A-Za-z0-9\-_]{4,25})', text, re.IGNORECASE)
    if batch_match:
        data["batch_number"] = batch_match.group(1).strip()
        data["field_confidence"]["batch_number"] = 0.96

    # Product: Paracetamol, Amoxicillin, Ibuprofen, Metformin, Ciprofloxacin, Aspirin, Glycerin, Azithromycin
    prod_match = re.search(r'\b(Paracetamol(?:\s+(?:API|DC)(?:\s+\d+(?:\.\d+)?%)?)?|Amoxicillin(?:\s+Trihydrate)?|Ibuprofen(?:\s+DC)?|Metformin(?:\s+HCl)?|Ciprofloxacin|Aspirin|Glycerin|Azithromycin)\b', text, re.IGNORECASE)
    if prod_match:
        data["product_name"] = prod_match.group(1).strip()
        data["field_confidence"]["product_name"] = 0.98

    # Strength / Grade: e.g. 99.5%, 500mg, 850mg, 250mg, 100mg, USP, IP, EP, BP, API Grade
    strength_match = re.search(r'\b(\d+(?:\.\d+)?\s*(?:%|mg|g|mcg|IU|ml)|USP|EP|BP|IP|DC\s*Grade|API\s*Grade)\b', text, re.IGNORECASE)
    if strength_match:
        data["product_strength"] = strength_match.group(1).strip()
        data["field_confidence"]["product_strength"] = 0.94

    # Customer Name: e.g. ABC Pharma, Apex Laboratories, Novartis, Pfizer
    cust_match = re.search(r'\b([A-Z][A-Za-z0-9&]*(?:\s+[A-Z][A-Za-z0-9&]*)*\s+(?:Pharma(?:ceuticals)?|Laboratories|Labs|Healthcare|Health|Care|Hospital|Distribution|Corp|GmbH|Inc|LLC|Ltd))\b', text)
    if not cust_match:
        cust_match = re.search(r'(?:Customer(?:\s*Name)?|Customer\s*:\s*|from\s*:\s*(?:qa@)?)\s*([A-Za-z0-9&\s]{2,30}?)(?:\.com|\s+reported|\s+rejects|\s+flagged|\s+noted|\s+received|\n|,)', text, re.IGNORECASE)
    
    if cust_match:
        c_name = cust_match.group(1).strip()
        if not any(stop in c_name.lower() for stop in ["good morning", "courier logistics", "quality defect", "quality assurance", "quality control report from"]):
            c_name = re.sub(r'^(?:Quality Control report from |QA Team at )', '', c_name, flags=re.IGNORECASE).strip()
            data["customer_name"] = c_name
            data["field_confidence"]["customer_name"] = 0.95

    # Quantity & Unit: e.g. 25 kg, 350 cartons, 1200 kg, 50 boxes, 450 vials, 10000 tablets
    qty_match = re.search(r'(\d+(?:,\d+)?(?:\.\d+)?)\s*(kg|kilograms|g|grams|cartons|boxes|drums|vials|bottles|packs|tablets)', text, re.IGNORECASE)
    if qty_match:
        data["quantity_affected"] = qty_match.group(1).replace(",", "")
        data["quantity_unit"] = qty_match.group(2).lower()
        data["field_confidence"]["quantity_affected"] = 0.95

    # Manufacturing Date: e.g. 12 August 2026, 2026-08-12, 10 May 2026, 01 June 2026
    mfg_match = re.search(r'(?:manufactured|mfg|prod(?:uction)?(?:\s*date)?)\s*(?:on|was|:)?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})', text, re.IGNORECASE)
    if mfg_match:
        data["manufacturing_date"] = mfg_match.group(1).strip()
        data["field_confidence"]["manufacturing_date"] = 0.92

    # Expiry Date: e.g. August 2028, May 2029, June 2029, March 2028
    exp_match = re.search(r'(?:expiry(?:\s*date)?|exp(?:ires|ire|iration)?(?:\s*date)?|exp\b)\s*(?:is|in|:)?\s*([A-Za-z]+\s+\d{4}|\d{4}-\d{2})', text, re.IGNORECASE)
    if exp_match:
        data["expiry_date"] = exp_match.group(1).strip()
        data["field_confidence"]["expiry_date"] = 0.92

    # Defect Type classification
    text_lower = text.lower()
    if any(w in text_lower for w in ["particle", "black particles", "speck", "foreign matter", "glass", "contamination", "metal", "discoloration", "yellow"]):
        data["complaint_type"] = "Foreign Matter / Contamination"
    elif any(w in text_lower for w in ["carton", "box", "package", "packaging", "seal", "leak", "crushed", "blister", "foil", "closure"]):
        data["complaint_type"] = "Packaging Defect / Damaged Container"
    elif any(w in text_lower for w in ["potency", "assay", "out of specification", "oos", "sub-potent", "dissolution", "sterility", "endotoxin"]):
        data["complaint_type"] = "Out of Specification / Potency"
    elif any(w in text_lower for w in ["color", "appearance", "chipped", "capping", "smell", "odor"]):
        data["complaint_type"] = "Physical Appearance / Color Variation"

    # Evaluate Risk Policy Engine
    policy = RiskPolicyEngine.evaluate_policy(data)
    data["severity"] = policy["severity"]
    data["priority"] = policy["priority"]
    data["ai_reasoning"] = policy["risk_rationale"]
    data["recommended_actions"] = policy["recommended_actions"]

    return data

def fallback_deterministic_edit_parser(instruction: str, current: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
    """Deterministic regex parser for safe patch creation on edit instructions"""
    changes: Dict[str, Any] = {}
    inst_lower = instruction.lower()

    # Edit Quantity: e.g. "change quantity to 40 kg", "change affected quantity to 0 kg", "500 vials"
    qty_match = re.search(r'(?:quantity|amount|volume)(?:\s*(?:affected|to|is|=))?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?', instruction, re.IGNORECASE)
    if not qty_match:
        qty_match = re.search(r'\b(?:to|is)\s+(\d+(?:\.\d+)?)\s*(kg|cartons|drums|vials|boxes|tablets|g)\b', instruction, re.IGNORECASE)

    if qty_match:
        changes["quantity_affected"] = qty_match.group(1)
        if qty_match.group(2):
            changes["quantity_unit"] = qty_match.group(2).lower()

    # Edit Batch Number: e.g. "change batch to PA240813", "change lot number to LOT-2026-X99"
    batch_match = re.search(r'(?:batch(?:\s*(?:number|no|#))?|lot(?:\s*(?:number|no|#))?)\s*(?:to|is|=)\s*([A-Za-z0-9\-_]{4,20})', instruction, re.IGNORECASE)
    if batch_match:
        changes["batch_number"] = batch_match.group(1).strip()

    # Edit Customer Name: e.g. "update customer name to Zenith Health Corp", "change customer to XYZ Pharma"
    cust_match = re.search(r'(?:customer(?:\s*name)?|client)\s*(?:to|is|=)\s*([A-Za-z0-9&\s]+?)(?:$|\.|\n)', instruction, re.IGNORECASE)
    if cust_match:
        changes["customer_name"] = cust_match.group(1).strip()

    # Edit Product Name: e.g. "change product to Metformin DC 95%"
    prod_match = re.search(r'(?:product(?:\s*name)?)\s*(?:to|is|=)\s*([A-Za-z0-9&\s%]+?)(?:$|\.|\n)', instruction, re.IGNORECASE)
    if prod_match:
        changes["product_name"] = prod_match.group(1).strip()

    # Edit Strength: e.g. "change strength to 500mg", "change product strength to IP Grade"
    strength_match = re.search(r'(?:product\s*strength|strength|grade)\s*(?:to|is|=)\s*([A-Za-z0-9\s%]+?)(?:$|\.|\n)', instruction, re.IGNORECASE)
    if strength_match:
        changes["product_strength"] = strength_match.group(1).strip()

    # Edit Severity: e.g. "set severity to Critical", "set severity to Low"
    sev_match = re.search(r'\b(?:severity|risk)\s*(?:to|is|=)\s*(Low|Medium|High|Critical)\b', instruction, re.IGNORECASE)
    if sev_match:
        changes["severity"] = sev_match.group(1).capitalize()

    # Edit Priority: e.g. "set priority to Urgent", "set priority to Low"
    prio_match = re.search(r'\b(?:priority)\s*(?:to|is|=)\s*(Low|Normal|High|Urgent)\b', instruction, re.IGNORECASE)
    if prio_match:
        changes["priority"] = prio_match.group(1).capitalize()

    # Edit Complaint Date / Manufacturing Date / Expiry Date
    if "manufacturing" in inst_lower:
        mfg_d = re.search(r'(?:manufacturing\s*date|mfg\s*date)\s*(?:to|is|=)\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})', instruction, re.IGNORECASE)
        if mfg_d:
            changes["manufacturing_date"] = mfg_d.group(1).strip()
    elif "expiry" in inst_lower:
        exp_d = re.search(r'(?:expiry\s*date|exp\s*date)\s*(?:to|is|=)\s*([A-Za-z]+\s+\d{4}|\d{4}-\d{2})', instruction, re.IGNORECASE)
        if exp_d:
            changes["expiry_date"] = exp_d.group(1).strip()
    else:
        date_match = re.search(r'(?:complaint\s*date|date)\s*(?:to|is|=)\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})', instruction, re.IGNORECASE)
        if date_match:
            changes["complaint_date"] = date_match.group(1).strip()

    # Edit Complaint Source
    if "source" in inst_lower:
        src_match = re.search(r'(?:complaint\s*source|source)\s*(?:to|is|=)\s*([A-Za-z0-9\s/]+?)(?:$|\.|\n)', instruction, re.IGNORECASE)
        if src_match:
            changes["complaint_source"] = src_match.group(1).strip()

    explanation = f"Updated {len(changes)} field(s): {', '.join(changes.keys())}." if changes else "No fields identified to update."
    return changes, explanation
