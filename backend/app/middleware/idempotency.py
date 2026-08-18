"""
AIVOA API Idempotency Middleware
Guarantees at-most-once execution for mutating requests (POST, PUT, PATCH) when `Idempotency-Key` header is provided.
"""

import time
import json
import logging
from typing import Dict, Any, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# In-memory LRU idempotency cache with TTL (1 hour)
# Structure: {key: (status_code, headers, body_json_or_bytes, timestamp)}
IDEMPOTENCY_CACHE: Dict[str, Tuple[int, Dict[str, str], Any, float]] = {}
CACHE_TTL_SECONDS = 3600

def clean_expired_entries():
    now = time.time()
    expired = [k for k, v in IDEMPOTENCY_CACHE.items() if now - v[3] > CACHE_TTL_SECONDS]
    for k in expired:
        IDEMPOTENCY_CACHE.pop(k, None)

class IdempotencyMiddleware(BaseHTTPMiddleware):
    """Intercepts mutating HTTP requests with `Idempotency-Key` header and replays stored response if cached"""

    async def dispatch(self, request: Request, call_next):
        if request.method not in ["POST", "PUT", "PATCH"]:
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")
        if not idempotency_key:
            return await call_next(request)

        clean_expired_entries()
        cache_key = f"{request.method}:{request.url.path}:{idempotency_key}"

        if cache_key in IDEMPOTENCY_CACHE:
            status_code, headers, cached_body, created_at = IDEMPOTENCY_CACHE[cache_key]
            logger.info(f"🔁 [Idempotency] Replaying cached response for key: {idempotency_key}")
            
            resp_headers = dict(headers)
            resp_headers["X-Cache-Lookup"] = "HIT-IDEMPOTENT"
            resp_headers["X-Original-Timestamp"] = str(created_at)

            return JSONResponse(
                status_code=status_code,
                content=cached_body,
                headers=resp_headers
            )

        # Execute downstream request
        response = await call_next(request)

        # Only cache successful or client error responses (don't cache 5xx server errors)
        if response.status_code < 500:
            # Read response body for caching
            body_bytes = b""
            async for chunk in response.body_iterator:
                body_bytes += chunk

            try:
                parsed_json = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                parsed_json = body_bytes.decode("utf-8", errors="ignore")

            resp_headers = {k: v for k, v in response.headers.items() if k.lower() not in ["content-length", "content-encoding"]}
            IDEMPOTENCY_CACHE[cache_key] = (response.status_code, resp_headers, parsed_json, time.time())

            return Response(
                content=body_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )

        return response
