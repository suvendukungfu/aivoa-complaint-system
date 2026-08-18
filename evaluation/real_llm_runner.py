"""
AIVOA Phase 9 — Real Groq LLM Verification Runner
Executes actual Groq API calls via the LangGraph StateGraph, capturing real model telemetry,
fallback status, latency, token usage, and semantic invariant validation.

Usage:
    python evaluation/real_llm_runner.py --limit 5
"""

import sys
import os
import argparse
import time
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.config import settings
from backend.app.services.ai_service import AIService
from backend.app.agents.providers import get_llm_provider, GroqProvider

CANONICAL_REAL_TEST_CASES = [
    {
        "id": "REAL-01",
        "title": "Foreign Particulate Contamination (Paracetamol API)",
        "prompt": "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected.",
        "invariants": {
            "customer_name": "ABC Pharma",
            "product_name_contains": "Paracetamol",
            "batch_number": "PA240812",
            "quantity_affected": "25",
            "severity_allowed": ["High", "Critical"]
        }
    },
    {
        "id": "REAL-02",
        "title": "Damaged Drum Closures (Amoxicillin Trihydrate)",
        "prompt": "Quality control at Apex Laboratories flagged crushed outer cartons and compromised seal liners for Amoxicillin Trihydrate, lot AMX-2026-884. Manufactured 10 May 2026, expiry May 2029. 50 boxes impacted.",
        "invariants": {
            "customer_name": "Apex Laboratories",
            "product_name_contains": "Amoxicillin",
            "batch_number": "AMX-2026-884",
            "quantity_affected": "50",
            "severity_allowed": ["Medium", "High"]
        }
    },
    {
        "id": "REAL-03",
        "title": "Dissolution & Out of Specification (Metformin HCl)",
        "prompt": "Metro Hospital Pharmacy reported out of specification dissolution results for Metformin HCl 500mg, batch MET-500-A. Expiry March 2028. 1200 kg retained.",
        "invariants": {
            "customer_name": "Metro Hospital Pharmacy",
            "product_name_contains": "Metformin",
            "batch_number": "MET-500-A",
            "quantity_affected": "1200",
            "severity_allowed": ["High", "Critical"]
        }
    },
    {
        "id": "REAL-04",
        "title": "Discoloration & Appearance (Ciprofloxacin)",
        "prompt": "Nordic Health Care noted yellow discoloration in Ciprofloxacin 250mg, batch CIP-2026-09. Expiry is December 2027. 450 vials affected.",
        "invariants": {
            "customer_name": "Nordic Health Care",
            "product_name_contains": "Ciprofloxacin",
            "batch_number": "CIP-2026-09",
            "quantity_affected": "450",
            "severity_allowed": ["Medium", "High", "Critical"]
        }
    },
    {
        "id": "REAL-05",
        "title": "Packaging Tear Discrepancy (Ibuprofen DC)",
        "prompt": "MedSupply Corp reported torn outer secondary packaging on Ibuprofen DC Grade, batch IBU-9901. Expiry June 2029. 15 drums received.",
        "invariants": {
            "customer_name": "MedSupply Corp",
            "product_name_contains": "Ibuprofen",
            "batch_number": "IBU-9901",
            "quantity_affected": "15",
            "severity_allowed": ["Low", "Medium"]
        }
    }
]


def validate_semantic_invariants(extracted: Dict[str, Any], invariants: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate extracted fields against semantic quality invariants without brittle string asserts"""
    from typing import Tuple
    violations = []
    
    # 1. Customer Name invariant
    if "customer_name" in invariants:
        expected_c = invariants["customer_name"].lower()
        actual_c = (extracted.get("customer_name") or "").lower()
        if expected_c not in actual_c and actual_c not in expected_c:
            violations.append(f"Customer Name mismatch: expected '{invariants['customer_name']}', got '{extracted.get('customer_name')}'")

    # 2. Product Name invariant
    if "product_name_contains" in invariants:
        expected_p = invariants["product_name_contains"].lower()
        actual_p = (extracted.get("product_name") or "").lower()
        if expected_p not in actual_p:
            violations.append(f"Product Name mismatch: expected keyword '{invariants['product_name_contains']}', got '{extracted.get('product_name')}'")

    # 3. Batch Number invariant
    if "batch_number" in invariants:
        expected_b = invariants["batch_number"].strip().upper()
        actual_b = (extracted.get("batch_number") or "").strip().upper()
        if expected_b != actual_b:
            violations.append(f"Batch Number mismatch: expected '{expected_b}', got '{actual_b}'")

    # 4. Quantity Affected invariant
    if "quantity_affected" in invariants:
        expected_q = str(invariants["quantity_affected"]).strip()
        actual_q = str(extracted.get("quantity_affected") or "").strip()
        if expected_q != actual_q:
            violations.append(f"Quantity mismatch: expected '{expected_q}', got '{actual_q}'")

    # 5. Severity Enum & Safety invariant
    if "severity_allowed" in invariants:
        actual_sev = extracted.get("severity") or "Medium"
        if actual_sev not in invariants["severity_allowed"]:
            violations.append(f"Severity outside allowed bounds {invariants['severity_allowed']}: got '{actual_sev}'")

    # 6. Evidence Non-Fabrication invariant
    provenance = extracted.get("field_provenance") or {}
    for f_name, p_item in provenance.items():
        if isinstance(p_item, dict):
            span = p_item.get("text_span")
            classification = p_item.get("classification")
            if classification == "INFERRED" and span is not None:
                violations.append(f"Fabrication violation: Inferred field '{f_name}' has non-null text_span '{span}'")

    return (len(violations) == 0, violations)


def run_real_llm_verification(limit: int = 5):
    print("\n" + "=" * 75)
    print("🔬 AIVOA REAL GROQ LLM PRODUCTION VERIFICATION RUNNER")
    print("=" * 75)

    groq_key = os.environ.get("GROQ_API_KEY") or settings.GROQ_API_KEY
    if not groq_key or not groq_key.strip():
        print("❌ CRITICAL ERROR: GROQ_API_KEY is not configured in environment or .env.")
        print("Please export GROQ_API_KEY='gsk_...' before running real LLM validation.")
        sys.exit(1)

    requested_model = settings.GROQ_MODEL or "gemma2-9b-it"
    test_cases = CANONICAL_REAL_TEST_CASES[:limit]
    
    results = []
    total_latency = 0
    passed_count = 0

    print(f"Configured API Key: {groq_key[:8]}...{groq_key[-4:]}")
    print(f"Target Primary Model: {requested_model}")
    print(f"Executing {len(test_cases)} production test cases via LangGraph StateGraph...\n")

    for idx, tc in enumerate(test_cases, 1):
        print(f"[{idx}/{len(test_cases)}] Executing Case: {tc['id']} — {tc['title']}...")
        
        start_time = time.time()
        ai_res = AIService.process_complaint_text(
            text=tc["prompt"],
            source="real_llm_runner"
        )
        elapsed_ms = int((time.time() - start_time) * 1000)
        total_latency += elapsed_ms

        complaint = ai_res.get("final_complaint", {})
        
        # Telemetry inspection from audit trail
        audit_trail = ai_res.get("audit_trail", [])
        extraction_audit = next((a for a in audit_trail if a.get("step_name") == "AI Extraction"), {})
        
        # Extract model metadata
        desc = extraction_audit.get("description", "")
        fallback_used = "Fallback" in desc or "deterministic" in desc.lower()
        
        # Determine actual responding model
        actual_model = requested_model
        fallback_reason = None
        if "Groq (" in desc:
            actual_model = desc.split("Groq (")[1].split(")")[0]
        elif "deterministic" in desc.lower():
            actual_model = "deterministic-rule-extractor"
            fallback_used = True
            fallback_reason = "Groq model decommissioned / fallback triggered"

        if actual_model != requested_model:
            fallback_used = True
            if not fallback_reason:
                fallback_reason = f"Primary model '{requested_model}' unavailable on Groq API"

        is_valid, violations = validate_semantic_invariants(complaint, tc["invariants"])
        if is_valid:
            passed_count += 1

        results.append({
            "case_id": tc["id"],
            "title": tc["title"],
            "requested_model": requested_model,
            "actual_model": actual_model,
            "fallback_used": fallback_used,
            "fallback_reason": fallback_reason,
            "latency_ms": elapsed_ms,
            "is_valid": is_valid,
            "violations": violations,
            "extracted": complaint
        })

        status_str = "✅ PASSED" if is_valid else "❌ FAILED"
        print(f"    ↳ Model Used: {actual_model} | Latency: {elapsed_ms}ms | Invariants: {status_str}")
        if violations:
            for v in violations:
                print(f"      ⚠️ {v}")

    # Aggregated Summary Report
    print("\n" + "=" * 75)
    print("📊 REAL GROQ LLM VERIFICATION SUMMARY")
    print("=" * 75)
    
    first_res = results[0] if results else {}
    print(f"Evaluation Mode: REAL_LLM\n")
    print(f"Provider:\nGroq\n")
    print(f"Requested Model:\n{requested_model}\n")
    print(f"Actual Model:\n{first_res.get('actual_model', requested_model)}\n")
    print(f"Fallback:\n{str(first_res.get('fallback_used', False)).lower()}\n")
    if first_res.get("fallback_reason"):
        print(f"Reason:\n{first_res.get('fallback_reason')}\n")
    print(f"Total Test Cases: {len(test_cases)}")
    print(f"Passed Invariant Checks: {passed_count} / {len(test_cases)} ({round(passed_count/len(test_cases)*100, 1)}%)")
    print(f"Average Turnaround Latency: {round(total_latency/len(test_cases), 1)} ms")
    print("=" * 75 + "\n")

    if passed_count < len(test_cases):
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIVOA Real Groq LLM Verification Runner")
    parser.add_argument("--limit", type=int, default=5, help="Number of canonical test cases to execute (default: 5)")
    args = parser.parse_args()
    
    run_real_llm_verification(limit=args.limit)
