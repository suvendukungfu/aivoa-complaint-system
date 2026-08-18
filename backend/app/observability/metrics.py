import time
import threading
from typing import Dict, Any, List, Optional

class TelemetryCollector:
    """Thread-safe collector for AI latency, throughput, model usage, and reliability metrics"""

    def __init__(self):
        self._lock = threading.Lock()
        self.ai_requests_total = 0
        self.ai_successes_total = 0
        self.ai_failures_total = 0
        self.total_latency_ms = 0
        self.latencies: List[int] = []
        self.start_time = time.time()
        self.last_successful_model: Optional[str] = None
        self.last_successful_provider: Optional[str] = None
        self.last_fallback_used: bool = False

    def record_ai_request(self) -> None:
        with self._lock:
            self.ai_requests_total += 1

    def record_ai_success(self, latency_ms: int, model: Optional[str] = None, provider: Optional[str] = None, fallback_used: bool = False) -> None:
        with self._lock:
            self.ai_successes_total += 1
            self.total_latency_ms += latency_ms
            self.latencies.append(latency_ms)
            if len(self.latencies) > 500:
                self.latencies.pop(0)
            if model:
                self.last_successful_model = model
            if provider:
                self.last_successful_provider = provider
            self.last_fallback_used = fallback_used

    def record_ai_failure(self, latency_ms: int) -> None:
        with self._lock:
            self.ai_failures_total += 1
            self.total_latency_ms += latency_ms
            self.latencies.append(latency_ms)
            if len(self.latencies) > 500:
                self.latencies.pop(0)

    def get_metrics(self) -> Dict[str, Any]:
        with self._lock:
            avg_lat = round(self.total_latency_ms / max(1, self.ai_requests_total), 1)
            sorted_lat = sorted(self.latencies) if self.latencies else [0]
            p95_index = int(len(sorted_lat) * 0.95)
            p95_lat = sorted_lat[min(p95_index, len(sorted_lat) - 1)]
            success_rate = round((self.ai_successes_total / max(1, self.ai_requests_total)) * 100, 1)

            return {
                "uptime_seconds": int(time.time() - self.start_time),
                "ai_requests_total": self.ai_requests_total,
                "ai_successes_total": self.ai_successes_total,
                "ai_failures_total": self.ai_failures_total,
                "success_rate_percent": success_rate,
                "avg_latency_ms": avg_lat,
                "p95_latency_ms": p95_lat,
                "last_successful_model": self.last_successful_model,
                "last_successful_provider": self.last_successful_provider,
                "last_fallback_used": self.last_fallback_used,
                "sample_count": len(self.latencies)
            }

telemetry_collector = TelemetryCollector()
