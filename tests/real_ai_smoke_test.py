"""
AIVOA Phase 9.3 — Canonical Standalone Real AI Smoke Test Runner
Can be run directly via: python tests/real_ai_smoke_test.py
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.ai_service import AIService

CANONICAL_PROMPT = (
    "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. "
    "Manufacturing date was 12 August 2026 and expiry is August 2028. 25 kg is affected."
)

def run_smoke_test():
    print("=" * 70)
    print("🧪 AIVOA CANONICAL REAL AI SMOKE TEST")
    print("=" * 70)
    print(f"Input Prompt:\n\"{CANONICAL_PROMPT}\"\n")
    
    res = AIService.process_complaint_text(CANONICAL_PROMPT, source="smoke_test_runner")
    complaint = res.get("final_complaint", {})
    
    invariants = [
        ("Customer Name == 'ABC Pharma'", complaint.get("customer_name") == "ABC Pharma"),
        ("Product contains 'Paracetamol'", "Paracetamol" in (complaint.get("product_name") or "")),
        ("Strength == '99.5%'", complaint.get("product_strength") == "99.5%"),
        ("Batch Number == 'PA240812'", complaint.get("batch_number") == "PA240812"),
        ("Manufacturing Date == '12 August 2026'", complaint.get("manufacturing_date") == "12 August 2026"),
        ("Expiry Date == 'August 2028'", complaint.get("expiry_date") == "August 2028"),
        ("Quantity Affected == '25'", str(complaint.get("quantity_affected")) == "25"),
        ("Quantity Unit == 'kg'", (complaint.get("quantity_unit") or "").lower() == "kg"),
        ("Severity in ['High', 'Critical']", complaint.get("severity") in ["High", "Critical"]),
        ("Priority in ['High', 'Urgent']", complaint.get("priority") in ["High", "Urgent"]),
    ]
    
    all_passed = True
    for label, passed in invariants:
        status_icon = "✅" if passed else "❌"
        print(f"  {status_icon} Invariant: {label}")
        if not passed:
            all_passed = False
            
    # Non-fabrication check
    provenance = complaint.get("field_provenance", {})
    fab_violations = []
    for f, p in provenance.items():
        if isinstance(p, dict) and p.get("classification") == "INFERRED" and p.get("text_span") is not None:
            fab_violations.append(f)
            
    if not fab_violations:
        print("  ✅ Invariant: Strict Evidence Non-Fabrication (Inferred text_spans are null)")
    else:
        print(f"  ❌ Invariant Violation: Fabricated spans in fields {fab_violations}")
        all_passed = False
        
    print("=" * 70)
    if all_passed:
        print("🎉 CANONICAL AI SMOKE TEST PASSED (100% INVARIANTS SATISFIED)\n")
        sys.exit(0)
    else:
        print("🚨 CANONICAL AI SMOKE TEST FAILED\n")
        sys.exit(1)

if __name__ == "__main__":
    run_smoke_test()
