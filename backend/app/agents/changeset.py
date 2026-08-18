"""
AIVOA ChangeSet Model & Mutation Pipeline
Canonical mutation pipeline ensuring safe, authorized, and validated field changes.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import datetime

from backend.app.agents.safety import SafetyGate

class ChangeItem(BaseModel):
    field: str
    old_value: Optional[Any] = None
    new_value: Any
    status: str = "PROPOSED"  # PROPOSED | APPROVED | REJECTED | APPLIED

class ChangeSet(BaseModel):
    operation: str = "UPDATE"
    ai_run_id: Optional[str] = None
    actor_type: str = "AI"  # AI | USER | SYSTEM
    actor_id: str = "aivoa_copilot"
    changes: Dict[str, Any] = Field(default_factory=dict)
    explanation: Optional[str] = None
    requires_approval: bool = False
    status: str = "PROPOSED"  # PROPOSED | APPLIED | REJECTED
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S UTC"))

class ChangeSetPipeline:
    """
    Validates and applies ChangeSets to complaint records through safety and authorization gates.
    """

    SENSITIVE_FIELDS = {"severity", "priority", "batch_number", "product_name"}

    @classmethod
    def process_and_apply(
        cls,
        base_complaint: Dict[str, Any],
        raw_changes: Dict[str, Any],
        ai_run_id: Optional[str] = None,
        actor_type: str = "AI",
        actor_id: str = "aivoa_copilot",
        require_approval_for_sensitive: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the canonical mutation pipeline.
        Returns:
            Dict containing updated complaint state, applied changeset, and audit diffs.
        """
        # Step 1: Safety Gate Schema Whitelisting
        sanitized_changes, warnings = SafetyGate.validate_extracted_payload(raw_changes)
        
        # Step 2: Identify sensitive modifications
        has_sensitive = bool(cls.SENSITIVE_FIELDS.intersection(set(sanitized_changes.keys())))
        needs_approval = require_approval_for_sensitive and has_sensitive

        # Step 3: Compute before/after diffs
        diffs: Dict[str, Dict[str, Any]] = {}
        updated_complaint = dict(base_complaint)
        updated_fields_list: List[str] = []

        for k, v in sanitized_changes.items():
            old_val = base_complaint.get(k)
            diffs[k] = {"before": old_val, "after": v}
            if not needs_approval:
                updated_complaint[k] = v
                updated_fields_list.append(k)

        changeset = ChangeSet(
            operation="UPDATE",
            ai_run_id=ai_run_id,
            actor_type=actor_type,
            actor_id=actor_id,
            changes=sanitized_changes,
            requires_approval=needs_approval,
            status="PROPOSED" if needs_approval else "APPLIED"
        )

        return {
            "updated_complaint": updated_complaint,
            "changeset": changeset.model_dump(),
            "updated_fields": updated_fields_list,
            "diffs": diffs,
            "warnings": warnings,
            "requires_approval": needs_approval
        }
