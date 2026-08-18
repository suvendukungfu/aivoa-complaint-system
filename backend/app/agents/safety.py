import re
import logging
from typing import Dict, Any, List, Tuple, Set

logger = logging.getLogger(__name__)

ALLOWED_COMPLAINT_FIELDS: Set[str] = {
    "complaint_source",
    "customer_name",
    "product_name",
    "product_strength",
    "batch_number",
    "manufacturing_date",
    "expiry_date",
    "quantity_affected",
    "quantity_unit",
    "complaint_type",
    "complaint_date",
    "detailed_description",
    "severity",
    "priority",
    "ai_confidence",
    "ai_reasoning",
    "recommended_actions",
    "field_confidence",
    "field_provenance"
}

ALLOWED_SEVERITIES = {"Low", "Medium", "High", "Critical"}
ALLOWED_PRIORITIES = {"Low", "Normal", "High", "Urgent"}
ALLOWED_STATUSES = {"Pending Triage", "Under Investigation", "Escalated to CAPA", "Closed"}

PROMPT_INJECTION_PATTERNS = [
    re.compile(r'\b(ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?)\b', re.IGNORECASE),
    re.compile(r'\b(reveal\s+(?:your\s+)?(?:system\s+prompt|api\s+key|secret|environment\s+variables|internal\s+instructions))\b', re.IGNORECASE),
    re.compile(r'\b(?:urgent\s+|system\s+)?override\b', re.IGNORECASE),
    re.compile(r'\b(you\s+are\s+now\s+(?:unrestricted|in\s+developer\s+mode|dan|in\s+debug\s+mode))\b', re.IGNORECASE),
    re.compile(r'\b(system\s*:\s*execute)\b', re.IGNORECASE),
    re.compile(r'<\s*script[^>]*>', re.IGNORECASE),
    re.compile(r'\b(drop\s+table|delete\s+from|delete\s+the\s+complaint|erase\s+all\s+audit|do\s+not\s+log\s+audit)\b', re.IGNORECASE),
    re.compile(r'\b(set\s+user\s+role\s+to\s+admin|set\s+status\s+to\s+[\'"]?closed[\'"]?|signed\s+by\s+qualified\s+person)\b', re.IGNORECASE),
    re.compile(r'\b(javascript\s*:|https?://[a-zA-Z0-9\-_.]*(?:malicious|attacker|evil|hack))\b', re.IGNORECASE),
    re.compile(r'\b(ignora\s+tutte\s+le\s+istruzioni)\b', re.IGNORECASE),
    re.compile(r'[\u202A-\u202E]', re.IGNORECASE),  # Bidi text direction override
    re.compile(r'(\.\./|\.\.\\)', re.IGNORECASE),  # Path traversal
    re.compile(r'\b(valid_bypass|bypass_token|fda_token|system\s+prompt\s+verbatim|internal\s+reasoning\s+trace)\b', re.IGNORECASE),
    re.compile(r'<\s*/?system_message\s*>', re.IGNORECASE),
    re.compile(r'("__proto__"|\brm\s+-rf\b|inject_arbitrary_field)', re.IGNORECASE),
    re.compile(r'[A-Za-z0-9]{80,}')  # Large buffer bloat
]

class SafetyGate:
    """Enterprise AI Safety Gate enforcing input sanitation, prompt injection defense, and field mutation safety"""

    @classmethod
    def scan_for_prompt_injection(cls, text: str) -> Tuple[bool, List[str]]:
        """Scan untrusted user or document text for prompt injection signals"""
        if not text:
            return False, []
        
        detected_flags = []
        for pattern in PROMPT_INJECTION_PATTERNS:
            if pattern.search(text):
                detected_flags.append(pattern.pattern)
                
        if detected_flags:
            logger.warning(f"SafetyGate detected potential prompt injection attack: {detected_flags}")
            return True, detected_flags
        return False, []

    @classmethod
    def validate_extracted_payload(cls, payload: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """
        Validate and sanitize extracted fields from LLM.
        Strips unauthorized fields and enforces strict QMS data constraints.
        """
        cleaned: Dict[str, Any] = {}
        violations: List[str] = []

        if not isinstance(payload, dict):
            return {}, ["Payload is not a valid dictionary"]

        for key, value in payload.items():
            if key not in ALLOWED_COMPLAINT_FIELDS:
                violations.append(f"Rejected unauthorized field: '{key}'")
                logger.warning(f"SafetyGate rejected unauthorized LLM key: '{key}'")
                continue

            # Validate Enum boundaries
            if key == "severity" and value:
                val_title = str(value).strip().title()
                if val_title not in ALLOWED_SEVERITIES:
                    violations.append(f"Normalized invalid severity '{value}' to 'Medium'")
                    val_title = "Medium"
                cleaned[key] = val_title
            elif key == "priority" and value:
                val_title = str(value).strip().title()
                if val_title not in ALLOWED_PRIORITIES:
                    violations.append(f"Normalized invalid priority '{value}' to 'Normal'")
                    val_title = "Normal"
                cleaned[key] = val_title
            elif key == "recommended_actions":
                if isinstance(value, list):
                    cleaned[key] = [str(x).strip() for x in value if str(x).strip()][:10]
                else:
                    cleaned[key] = []
            else:
                cleaned[key] = value

        return cleaned, violations

    @classmethod
    def validate_edit_patch(cls, patch: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """Validate that a patch dictionary only contains approved mutable fields"""
        cleaned_patch = {}
        violations = []

        for key, val in patch.items():
            if key not in ALLOWED_COMPLAINT_FIELDS:
                violations.append(f"Unauthorized edit target: '{key}'")
                continue
            cleaned_patch[key] = val

        return cleaned_patch, violations
