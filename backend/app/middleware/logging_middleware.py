import time
import json
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("aivo.access")

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware recording structured JSON access logs with request IDs and duration"""

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "unknown")
        
        response = await call_next(request)
        duration_ms = int((time.time() - start_time) * 1000)

        # Do not log health endpoint spam excessively
        if not request.url.path.startswith("/api/health"):
            log_data = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms
            }
            logger.info(json.dumps(log_data))

        return response
