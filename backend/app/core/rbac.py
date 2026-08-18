"""
AIVOA Role-Based Access Control (RBAC) Abstraction Layer
Enforces pharmaceutical GxP security, segregation of duties, and authorization permissions.
"""

import enum
from typing import Set, Dict, Optional
from fastapi import HTTPException, status

class Role(str, enum.Enum):
    COMPLAINT_OPERATOR = "COMPLAINT_OPERATOR"
    QUALITY_REVIEWER = "QUALITY_REVIEWER"
    QUALITY_MANAGER = "QUALITY_MANAGER"
    ADMIN = "ADMIN"

class Permission(str, enum.Enum):
    CREATE_COMPLAINT = "CREATE_COMPLAINT"
    EDIT_COMPLAINT = "EDIT_COMPLAINT"
    REVIEW_AI_PROPOSAL = "REVIEW_AI_PROPOSAL"
    CHANGE_SEVERITY = "CHANGE_SEVERITY"
    CHANGE_PRIORITY = "CHANGE_PRIORITY"
    CHANGE_STATUS = "CHANGE_STATUS"
    CLOSE_COMPLAINT = "CLOSE_COMPLAINT"
    VIEW_AUDIT = "VIEW_AUDIT"

# Role to Permissions Mapping Matrix
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.COMPLAINT_OPERATOR: {
        Permission.CREATE_COMPLAINT,
        Permission.EDIT_COMPLAINT,
        Permission.VIEW_AUDIT
    },
    Role.QUALITY_REVIEWER: {
        Permission.CREATE_COMPLAINT,
        Permission.EDIT_COMPLAINT,
        Permission.REVIEW_AI_PROPOSAL,
        Permission.CHANGE_SEVERITY,
        Permission.CHANGE_PRIORITY,
        Permission.CHANGE_STATUS,
        Permission.VIEW_AUDIT
    },
    Role.QUALITY_MANAGER: {
        Permission.CREATE_COMPLAINT,
        Permission.EDIT_COMPLAINT,
        Permission.REVIEW_AI_PROPOSAL,
        Permission.CHANGE_SEVERITY,
        Permission.CHANGE_PRIORITY,
        Permission.CHANGE_STATUS,
        Permission.CLOSE_COMPLAINT,
        Permission.VIEW_AUDIT
    },
    Role.ADMIN: {
        Permission.CREATE_COMPLAINT,
        Permission.EDIT_COMPLAINT,
        Permission.REVIEW_AI_PROPOSAL,
        Permission.CHANGE_SEVERITY,
        Permission.CHANGE_PRIORITY,
        Permission.CHANGE_STATUS,
        Permission.CLOSE_COMPLAINT,
        Permission.VIEW_AUDIT
    }
}

class AuthorizationService:
    """Enterprise Authorization Policy Engine for Pharmaceutical QMS Operations"""

    @classmethod
    def normalize_role(cls, role_input: Optional[str]) -> Role:
        """Convert arbitrary string into normalized Role enum"""
        if not role_input:
            return Role.QUALITY_REVIEWER  # Default to Quality Reviewer for demo context
        
        cleaned = role_input.strip().upper().replace(" ", "_")
        try:
            return Role(cleaned)
        except ValueError:
            # Fallback aliases
            if "OPERATOR" in cleaned or "USER" in cleaned:
                return Role.COMPLAINT_OPERATOR
            if "MANAGER" in cleaned or "QP" in cleaned:
                return Role.QUALITY_MANAGER
            if "ADMIN" in cleaned:
                return Role.ADMIN
            return Role.QUALITY_REVIEWER

    @classmethod
    def has_permission(cls, role: Role, permission: Permission) -> bool:
        """Check if role has granted permission"""
        allowed = ROLE_PERMISSIONS.get(role, set())
        return permission in allowed

    @classmethod
    def enforce(cls, role_input: Optional[str], permission: Permission, user_id: Optional[str] = None):
        """Enforce permission or raise HTTP 403 Forbidden"""
        role = cls.normalize_role(role_input)
        if not cls.has_permission(role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "UNAUTHORIZED_OPERATION",
                        "message": f"User '{user_id or 'anonymous'}' with role '{role.value}' does not possess required permission '{permission.value}'.",
                        "required_permission": permission.value,
                        "user_role": role.value
                    }
                }
            )
