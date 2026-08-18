"""
AIVOA AI Run Repository
Persists and queries AI inference runs and telemetry execution history.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.complaint import AIRun
import logging

logger = logging.getLogger(__name__)

class AIRunRepository:
    def __init__(self, db: Session):
        self.db = db

    def record_run(
        self,
        ai_run_id: str,
        workflow: str,
        requested_model: str,
        actual_model: str,
        prompt_version: str,
        status: str = "SUCCESS",
        latency_ms: int = 0,
        retry_count: int = 0,
        fallback_used: bool = False,
        fallback_reason: Optional[str] = None,
        validation_status: str = "VALID",
        request_id: Optional[str] = None,
        complaint_id: Optional[int] = None,
        input_tokens: int = 0,
        output_tokens: int = 0
    ) -> AIRun:
        """Create and persist an AI Run record"""
        run = AIRun(
            ai_run_id=ai_run_id,
            request_id=request_id,
            complaint_id=complaint_id,
            workflow=workflow,
            requested_model=requested_model,
            actual_model=actual_model,
            prompt_version=prompt_version,
            status=status,
            latency_ms=latency_ms,
            retry_count=retry_count,
            fallback_used=fallback_used,
            fallback_reason=fallback_reason,
            validation_status=validation_status,
            input_tokens=input_tokens,
            output_tokens=output_tokens
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_recent_runs(self, limit: int = 50) -> List[AIRun]:
        """Fetch recent AI inference runs ordered by timestamp"""
        return self.db.query(AIRun).order_by(AIRun.created_at.desc()).limit(limit).all()

    def get_by_run_id(self, ai_run_id: str) -> Optional[AIRun]:
        """Fetch AI run by unique identifier"""
        return self.db.query(AIRun).filter(AIRun.ai_run_id == ai_run_id).first()
