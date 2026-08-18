"""
AIVOA Phase 9.22 & 9.23 — Production Performance & Concurrent Load Testing Suite
Executes:
1. Test A: High-concurrency throughput test (50 concurrent threads) measuring p50, p95, p99.
2. Test B: Controlled real Groq multi-threaded evaluation measuring end-to-end cloud latency.
"""

import sys
import time
import statistics
from pathlib import Path
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.agents.providers import GroqProvider

CANONICAL_PAYLOAD = {
    "text": "ABC Pharma reported visible black particles in Paracetamol API 99.5%, batch PA240812. 25 kg affected."
}

def execute_single_request(client: TestClient, payload: Dict[str, Any]) -> Dict[str, Any]:
    start_t = time.time()
    try:
        res = client.post("/api/v1/complaints/log", json=payload)
        latency_ms = (time.time() - start_t) * 1000
        return {
            "status_code": res.status_code,
            "latency_ms": latency_ms,
            "success": res.status_code == 200,
            "error": None if res.status_code == 200 else res.text
        }
    except Exception as e:
        latency_ms = (time.time() - start_t) * 1000
        return {
            "status_code": 500,
            "latency_ms": latency_ms,
            "success": False,
            "error": str(e)
        }


def run_load_test_suite_a_high_throughput(total_requests: int = 50, concurrency: int = 10) -> Dict[str, Any]:
    """Test A: 50 concurrent requests evaluating API middleware, routing, DB and deterministic engine"""
    print("\n" + "=" * 70)
    print(f"🚀 TEST A: HIGH-THROUGHPUT CONCURRENCY TEST ({total_requests} REQS @ {concurrency} WORKERS)")
    print("=" * 70)

    client = TestClient(app)
    results = []

    start_wall_clock = time.time()
    
    # Run with deterministic fallback for pure web server/database benchmark
    with patch.object(GroqProvider, "is_available", return_value=False):
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(execute_single_request, client, CANONICAL_PAYLOAD) for _ in range(total_requests)]
            for future in as_completed(futures):
                results.append(future.result())

    total_wall_time = time.time() - start_wall_clock
    
    latencies = [r["latency_ms"] for r in results]
    successes = sum(1 for r in results if r["success"])
    failures = len(results) - successes

    latencies.sort()
    p50 = statistics.median(latencies)
    p90 = latencies[int(len(latencies) * 0.90)]
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    rps = round(total_requests / total_wall_time, 2)

    print(f"• Total Requests:    {total_requests}")
    print(f"• Success Rate:      {successes}/{total_requests} ({round((successes/total_requests)*100, 1)}%)")
    print(f"• Error Rate:        {round((failures/total_requests)*100, 2)}%")
    print(f"• Throughput:        {rps} req/sec")
    print(f"• p50 Latency:       {round(p50, 2)} ms")
    print(f"• p90 Latency:       {round(p90, 2)} ms")
    print(f"• p95 Latency:       {round(p95, 2)} ms")
    print(f"• p99 Latency:       {round(p99, 2)} ms")
    print("=" * 70)

    return {
        "total": total_requests,
        "successes": successes,
        "failures": failures,
        "rps": rps,
        "p50": round(p50, 2),
        "p95": round(p95, 2),
        "p99": round(p99, 2)
    }


def run_load_test_suite_b_real_groq(total_requests: int = 5, concurrency: int = 2) -> Dict[str, Any]:
    """Test B: Controlled multi-request test against live Groq cloud API"""
    print("\n" + "=" * 70)
    print(f"🌐 TEST B: REAL GROQ CLOUD LOAD TEST ({total_requests} REQS @ {concurrency} WORKERS)")
    print("=" * 70)

    client = TestClient(app)
    results = []

    start_wall_clock = time.time()
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(execute_single_request, client, CANONICAL_PAYLOAD) for _ in range(total_requests)]
        for future in as_completed(futures):
            results.append(future.result())

    total_wall_time = time.time() - start_wall_clock
    latencies = [r["latency_ms"] for r in results]
    successes = sum(1 for r in results if r["success"])
    failures = len(results) - successes

    latencies.sort()
    p50 = statistics.median(latencies)
    avg_l = sum(latencies) / len(latencies)
    rps = round(total_requests / total_wall_time, 2)

    print(f"• Total Requests:    {total_requests}")
    print(f"• Success Rate:      {successes}/{total_requests} ({round((successes/total_requests)*100, 1)}%)")
    print(f"• Average Latency:   {round(avg_l, 2)} ms")
    print(f"• p50 Latency:       {round(p50, 2)} ms")
    print(f"• Cloud Throughput:  {rps} req/sec")
    print("=" * 70 + "\n")

    return {
        "total": total_requests,
        "successes": successes,
        "failures": failures,
        "avg_ms": round(avg_l, 2),
        "p50": round(p50, 2)
    }


if __name__ == "__main__":
    res_a = run_load_test_suite_a_high_throughput(total_requests=50, concurrency=10)
    res_b = run_load_test_suite_b_real_groq(total_requests=5, concurrency=2)
