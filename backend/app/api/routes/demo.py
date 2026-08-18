"""
AIVOA Phase 9.27 — Demo Data & Reset Endpoint
Provides safe resetting and re-seeding of realistic GxP pharmaceutical complaint scenarios.
Strictly guarded against execution in production environments.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.models.complaint import Complaint, AIProposal, ComplaintEvent
from backend.app.services.complaint_service import ComplaintService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/demo", tags=["Demo Management"])

DEMO_SEED_SCENARIOS = [
    {
        "customer_name": "ABC Pharma Global",
        "product_name": "Paracetamol API",
        "product_strength": "99.5%",
        "batch_number": "PA240812",
        "manufacturing_date": "12 August 2026",
        "expiry_date": "August 2028",
        "quantity_affected": "25",
        "quantity_unit": "kg",
        "complaint_type": "Foreign Matter / Contamination",
        "severity": "Medium",
        "priority": "Urgent",
        "detailed_description": "ABC Pharma QA inspector observed visible black particulate contamination during incoming QA sampling.",
        "status": "PENDING_TRIAGE",
        "proposals": [
            {
                "proposal_type": "RISK_SEVERITY",
                "field_name": "severity",
                "current_value": "Medium",
                "proposed_value": "High",
                "reason": "Visible foreign particulate matter in active pharmaceutical ingredient represents patient safety risk (USP <788>).",
                "source": "AI Risk Assessment",
                "confidence_score": 0.98
            },
            {
                "proposal_type": "REGULATORY_FLAG",
                "field_name": "regulatory_reporting_required",
                "current_value": "false",
                "proposed_value": "true",
                "reason": "Potential critical quality defect requires preliminary QA escalation assessment within 48 hours.",
                "source": "RiskPolicyEngine",
                "confidence_score": 0.94
            }
        ]
    },
    {
        "customer_name": "Apex Laboratories",
        "product_name": "Amoxicillin Trihydrate",
        "product_strength": "500mg Capsules",
        "batch_number": "AMX-2026-884",
        "manufacturing_date": "10 May 2026",
        "expiry_date": "May 2029",
        "quantity_affected": "50",
        "quantity_unit": "boxes",
        "complaint_type": "Packaging & Labelling",
        "severity": "Medium",
        "priority": "Normal",
        "detailed_description": "Warehouse intake reported crushed outer shipper cartons with tamper-evident seal liners compromised.",
        "status": "UNDER_REVIEW",
        "proposals": [
            {
                "proposal_type": "FIELD_UPDATE",
                "field_name": "risk_score",
                "current_value": "45.0",
                "proposed_value": "68.0",
                "reason": "Compromised tamper-evident seals elevate risk of moisture ingress and chemical degradation.",
                "source": "AI Quality Engine",
                "confidence_score": 0.91
            }
        ]
    },
    {
        "customer_name": "Metro Hospital Pharmacy",
        "product_name": "Metformin HCl",
        "product_strength": "500mg Extended Release",
        "batch_number": "MET-500-A",
        "manufacturing_date": "01 March 2026",
        "expiry_date": "March 2028",
        "quantity_affected": "1200",
        "quantity_unit": "bottles",
        "complaint_type": "Product Quality / OOS",
        "severity": "High",
        "priority": "Urgent",
        "detailed_description": "Hospital clinical lab reported out-of-specification dissolution release profiles during routine hospital QA testing.",
        "status": "INVESTIGATION",
        "proposals": [
            {
                "proposal_type": "RISK_SEVERITY",
                "field_name": "severity",
                "current_value": "High",
                "proposed_value": "Critical",
                "reason": "OOS dissolution profile impacts pharmacokinetic bioavailability in vulnerable diabetic patients.",
                "source": "AI Risk Assessment",
                "confidence_score": 0.99
            }
        ]
    }
]


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_demo_environment(db: Session = Depends(get_db)):
    """
    Reset demo database state and reseed with 3 flagship pharmaceutical scenarios.
    Strictly blocked in production environments.
    """
    if settings.ENVIRONMENT.lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN_IN_PRODUCTION",
                    "message": "Demo reset endpoint is strictly disabled in production environments."
                }
            }
        )

    try:
        # 1. Clean existing records in referential order
        db.query(AIProposal).delete()
        db.query(ComplaintEvent).delete()
        db.query(Complaint).delete()
        db.commit()

        # 2. Seed realistic demo scenarios
        service = ComplaintService(db)
        seeded_count = 0
        
        for sc in DEMO_SEED_SCENARIOS:
            complaint_data = {k: v for k, v in sc.items() if k != "proposals"}
            complaint, _ = service.save_or_create_complaint(complaint_data)
            
            # Transition state if non-default
            if sc.get("status") and sc["status"] != "DRAFT":
                complaint.status = sc["status"]
                db.commit()
                db.refresh(complaint)

            if sc.get("proposals"):
                service.create_ai_proposals(complaint.id, sc["proposals"])
                
            seeded_count += 1

        return {
            "success": True,
            "message": f"Demo environment successfully reset and reseeded with {seeded_count} flagship GxP scenarios.",
            "seeded_scenarios": [s["batch_number"] for s in DEMO_SEED_SCENARIOS]
        }
    except Exception as e:
        db.rollback()
        logger.exception(f"Demo reset failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "DEMO_RESET_FAILED", "message": str(e)}}
        )
