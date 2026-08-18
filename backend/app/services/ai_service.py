import time
import logging
import uuid
from typing import Dict, Any, Optional

from backend.app.agents.graph import run_complaint_pipeline, run_edit_pipeline
from backend.app.observability.metrics import telemetry_collector

logger = logging.getLogger(__name__)

class AIService:
    """Enterprise AI Orchestration Service handling LangGraph execution, retries, and telemetry"""

    @classmethod
    def process_complaint_text(
        cls,
        text: str,
        source: str = "customer_prompt",
        request_id: Optional[str] = None,
        pages: Optional[list] = None,
        document_filename: Optional[str] = None,
        ai_run_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute the LangGraph complaint intake state machine with telemetry"""
        req_id = request_id or f"req_{uuid.uuid4().hex[:8]}"
        run_id = ai_run_id or f"AI-{uuid.uuid4().hex[:6].upper()}"
        start_time = time.time()
        
        telemetry_collector.record_ai_request()
        try:
            result = run_complaint_pipeline(
                raw_text=text,
                source=source,
                pages=pages,
                document_filename=document_filename,
                ai_run_id=run_id
            )
            latency_ms = int((time.time() - start_time) * 1000)
            meta = result.get("model_metadata", {})
            telemetry_collector.record_ai_success(
                latency_ms=latency_ms,
                model=meta.get("actual_model"),
                provider=meta.get("actual_provider", "groq"),
                fallback_used=meta.get("fallback_used", False)
            )
            logger.info(f"[{req_id}] AI Complaint pipeline completed in {latency_ms}ms (Source: {source}, Run: {run_id}, Model: {meta.get('actual_model')})")
            return result
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            telemetry_collector.record_ai_failure(latency_ms)
            logger.error(f"[{req_id}] AI Complaint pipeline failed in {latency_ms}ms: {e}")
            raise

    @classmethod
    def process_complaint_edit(
        cls,
        instruction: str,
        current_complaint: Dict[str, Any],
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute the LangGraph safe edit state machine with telemetry"""
        req_id = request_id or f"req_{uuid.uuid4().hex[:8]}"
        start_time = time.time()
        
        telemetry_collector.record_ai_request()
        try:
            result = run_edit_pipeline(instruction, current_complaint)
            latency_ms = int((time.time() - start_time) * 1000)
            meta = result.get("model_metadata", {})
            telemetry_collector.record_ai_success(
                latency_ms=latency_ms,
                model=meta.get("actual_model"),
                provider=meta.get("actual_provider", "groq"),
                fallback_used=meta.get("fallback_used", False)
            )
            logger.info(f"[{req_id}] AI Edit pipeline completed in {latency_ms}ms")
            return result
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            telemetry_collector.record_ai_failure(latency_ms)
            logger.error(f"[{req_id}] AI Edit pipeline failed in {latency_ms}ms: {e}")
            raise

    process_natural_language_edit = process_complaint_edit
