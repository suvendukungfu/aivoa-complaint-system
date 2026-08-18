"""
AIVOA Pharmaceutical Risk Policy Engine
Enforces deterministic regulatory safety floors independent of LLM reasoning.
"""

from typing import Dict, Any, Tuple, List, Optional
import logging

logger = logging.getLogger(__name__)

SEVERITY_RANKS = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
PRIORITY_RANKS = {"Low": 1, "Normal": 2, "High": 3, "Urgent": 4}

class RiskPolicyEngine:
    """
    Deterministic QMS policy engine that validates and guarantees safety floors
    for critical pharmaceutical manufacturing defects.
    """

    CRITICAL_KEYWORDS = [
        "toxic", "poison", "death", "hospital", "anaphylaxis",
        "sterility failure", "unsterile", "microbial", "endotoxin",
        "wrong active", "wrong strength", "cross contamination"
    ]

    HIGH_KEYWORDS = [
        "black particles", "foreign matter", "glass", "metal",
        "black specks", "contamination", "potency failure", "out of specification",
        "assay failure", "compromised seal", "broken vial", "leakage"
    ]

    @classmethod
    def evaluate_policy(
        cls,
        complaint: Dict[str, Any],
        ai_severity: Optional[str] = None,
        ai_priority: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate regulatory safety floor against complaint facts and AI recommendations.
        """
        desc = (complaint.get("detailed_description") or "").lower()
        ctype = (complaint.get("complaint_type") or "").lower()
        prod = (complaint.get("product_name") or "").lower()
        combined_text = f"{desc} {ctype} {prod}"

        floor_severity = "Low"
        floor_priority = "Normal"
        adjustments: List[str] = []

        # Check Critical triggers
        if any(kw in combined_text for kw in cls.CRITICAL_KEYWORDS):
            floor_severity = "Critical"
            floor_priority = "Urgent"
            adjustments.append("Critical safety policy enforced due to potential sterility/toxicity/potency patient safety impact.")
        elif any(kw in combined_text for kw in cls.HIGH_KEYWORDS):
            floor_severity = "High"
            floor_priority = "Urgent"
            adjustments.append("High severity floor enforced due to particulate contamination / container compromise.")
        elif "carton" in combined_text or "packaging" in combined_text or "label" in combined_text:
            floor_severity = "Medium"
            floor_priority = "Normal"

        final_severity = ai_severity or floor_severity
        final_priority = ai_priority or floor_priority

        # Enforce safety floors
        overridden = False
        if SEVERITY_RANKS.get(final_severity, 1) < SEVERITY_RANKS.get(floor_severity, 1):
            adjustments.append(f"AI severity '{final_severity}' escalated to policy floor '{floor_severity}'.")
            final_severity = floor_severity
            overridden = True

        if PRIORITY_RANKS.get(final_priority, 1) < PRIORITY_RANKS.get(floor_priority, 1):
            adjustments.append(f"AI priority '{final_priority}' escalated to policy floor '{floor_priority}'.")
            final_priority = floor_priority
            overridden = True

        # Determine standard recommended actions
        recommended_actions = []
        if final_severity in ["Critical", "High"]:
            recommended_actions.extend([
                "Quarantine affected batch in distribution center immediately",
                "Initiate formal Level-2 Quality Deviation investigation",
                "Review Batch Manufacturing Record (BMR) and environmental monitoring logs",
                "Notify Qualified Person (QP) and Regulatory Affairs"
            ])
        elif final_severity == "Medium":
            recommended_actions.extend([
                "Perform physical inspection on retention samples",
                "Request sample return from customer for QA laboratory evaluation",
                "Log internal deviation in TrackWise / Veeva QMS"
            ])
        else:
            recommended_actions.extend([
                "Verify batch release Certificate of Analysis (CoA)",
                "Document customer communication in QMS complaint log"
            ])

        rationale = " ".join(adjustments) if adjustments else "Standard quality triage evaluation."

        return {
            "severity": final_severity,
            "priority": final_priority,
            "risk_rationale": rationale,
            "policy_floor_severity": floor_severity,
            "policy_floor_priority": floor_priority,
            "policy_overridden": overridden,
            "policy_adjustments": adjustments,
            "recommended_actions": recommended_actions,
            "disclaimer": "AI-generated initial triage recommendation. Final assessment requires qualified Quality personnel."
        }
