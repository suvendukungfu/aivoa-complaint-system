import os
import time
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
import importlib
from typing import Optional, Tuple, Any, List
from langchain_core.messages import BaseMessage

try:
    _groq_mod = importlib.import_module("langchain_groq")
    ChatGroq = getattr(_groq_mod, "ChatGroq", None)
except Exception:
    ChatGroq = None

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class ModelExecutionResult:
    content: Optional[str]
    requested_model: str
    actual_model: str
    fallback_used: bool
    fallback_reason: Optional[str]
    latency_ms: int
    requested_provider: str = "groq"
    actual_provider: str = "groq"
    tokens_used: int = 0
    success: bool = True

class LLMProvider(ABC):
    """Abstract Base Class for LLM inference providers with telemetry"""

    @abstractmethod
    def invoke(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> Tuple[Optional[str], str, int]:
        """Legacy invocation returning (content, actual_model, latency_ms)"""
        pass

    @abstractmethod
    def invoke_with_telemetry(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> ModelExecutionResult:
        """Full telemetry invocation returning ModelExecutionResult"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider credentials and endpoints are configured"""
        pass


class GroqProvider(LLMProvider):
    """Production & Demo Groq provider with primary gemma2-9b-it model and truthful telemetry tracking"""

    def __init__(self, api_key: Optional[str] = None, default_model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.default_model = default_model or settings.GROQ_MODEL
        # Primary is gemma2-9b-it; fallback models are only used if primary fails
        self.fallback_models = [
            self.default_model,
            settings.GROQ_FALLBACK_MODEL,
            "llama-3.3-70b-versatile",
            "openai/gpt-oss-20b",
            "openai/gpt-oss-120b",
            "qwen/qwen3.6-27b",
            "llama-3.1-8b-instant",
        ]

    def is_available(self) -> bool:
        return bool(self.api_key)

    def invoke_with_telemetry(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> ModelExecutionResult:
        requested_model = self.default_model or "gemma2-9b-it"

        if not self.is_available():
            logger.warning("Groq API key not configured. Cannot invoke GroqProvider.")
            return ModelExecutionResult(
                content=None,
                requested_provider="groq",
                requested_model=requested_model,
                actual_provider="deterministic-fallback",
                actual_model="deterministic-fallback",
                fallback_used=True,
                fallback_reason="Groq API key not configured",
                latency_ms=0,
                success=False
            )

        # Unique ordered models to try: Primary (gemma2-9b-it) first
        seen = set()
        models_to_try = []
        for m in self.fallback_models:
            if m and m not in seen:
                seen.add(m)
                models_to_try.append(m)

        first_error = None
        for idx, model in enumerate(models_to_try):
            start_time = time.time()
            try:
                if ChatGroq is None:
                    raise ImportError("langchain_groq package is not installed in the current environment")

                llm = ChatGroq(
                    groq_api_key=self.api_key,
                    model_name=model,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                response = llm.invoke(messages)
                latency_ms = int((time.time() - start_time) * 1000)
                
                is_fallback = (model != requested_model)
                fallback_reason = str(first_error) if is_fallback else None
                
                # Estimate token usage
                input_char_len = sum(len(str(m.content)) for m in messages)
                output_char_len = len(response.content) if response.content else 0
                tokens_est = (input_char_len + output_char_len) // 4

                return ModelExecutionResult(
                    content=response.content,
                    requested_provider="groq",
                    requested_model=requested_model,
                    actual_provider="groq",
                    actual_model=model,
                    fallback_used=is_fallback,
                    fallback_reason=fallback_reason,
                    latency_ms=latency_ms,
                    tokens_used=tokens_est,
                    success=True
                )
            except Exception as e:
                latency_ms = int((time.time() - start_time) * 1000)
                if first_error is None:
                    first_error = e
                logger.warning(f"Groq invocation failed on model '{model}' ({e}) in {latency_ms}ms. Retrying fallback...")

        logger.error(f"All Groq fallback models exhausted. Primary error: {first_error}")
        return ModelExecutionResult(
            content=None,
            requested_provider="groq",
            requested_model=requested_model,
            actual_provider="groq",
            actual_model="exhausted",
            fallback_used=True,
            fallback_reason=str(first_error),
            latency_ms=0,
            success=False
        )

    def invoke(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> Tuple[Optional[str], str, int]:
        res = self.invoke_with_telemetry(messages, temperature, max_tokens)
        return res.content, res.actual_model, res.latency_ms


class MockProvider(LLMProvider):
    """Deterministic Mock LLM provider for zero-network CI, offline testing, and load simulation"""

    def __init__(self, mock_response: Optional[str] = None):
        self.mock_response = mock_response

    def is_available(self) -> bool:
        return True

    def invoke_with_telemetry(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> ModelExecutionResult:
        if self.mock_response:
            return ModelExecutionResult(
                content=self.mock_response,
                requested_provider="mock",
                requested_model="gemma2-9b-it",
                actual_provider="mock",
                actual_model="mock-v1",
                fallback_used=False,
                fallback_reason=None,
                latency_ms=5,
                tokens_used=120,
                success=True
            )
        
        default_json = """{
            "complaint_source": "Customer Direct / Email",
            "customer_name": "ABC Pharma",
            "product_name": "Paracetamol API",
            "product_strength": "99.5%",
            "batch_number": "PA240812",
            "manufacturing_date": "12 August 2026",
            "expiry_date": "August 2028",
            "quantity_affected": "25",
            "quantity_unit": "kg",
            "complaint_type": "Foreign Matter / Contamination",
            "complaint_date": "17 August 2026",
            "detailed_description": "Black particles in top layer",
            "severity": "High",
            "priority": "Urgent",
            "ai_confidence": 0.95,
            "ai_reasoning": "Foreign particulate matter identified in active substance.",
            "recommended_actions": ["Quarantine batch in distribution warehouse", "Review BMR records"],
            "field_confidence": {"product_name": 0.98, "batch_number": 0.96}
        }"""
        return ModelExecutionResult(
            content=default_json,
            requested_provider="mock",
            requested_model="gemma2-9b-it",
            actual_provider="mock",
            actual_model="mock-v1",
            fallback_used=False,
            fallback_reason=None,
            latency_ms=5,
            tokens_used=150,
            success=True
        )

    def invoke(
        self,
        messages: List[BaseMessage],
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> Tuple[Optional[str], str, int]:
        res = self.invoke_with_telemetry(messages, temperature, max_tokens)
        return res.content, res.actual_model, res.latency_ms


def get_llm_provider(force_mock: bool = False) -> LLMProvider:
    """Factory method providing active LLM provider instance"""
    if force_mock:
        return MockProvider()
    return GroqProvider()
