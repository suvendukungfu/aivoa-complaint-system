import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory rate limiter protecting AI intake endpoints from accidental abuse"""

    def __init__(self, app, max_requests_per_minute: int = 120):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.request_records = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        # Rate limit only AI-heavy mutation routes
        if request.method in ["POST", "PUT"] and any(
            p in request.url.path for p in ["/api/complaints/log", "/api/complaints/edit", "/api/complaints/extract"]
        ):
            client_ip = request.client.host if request.client else "127.0.0.1"
            now = time.time()
            # Clean records older than 60 seconds
            self.request_records[client_ip] = [
                t for t in self.request_records[client_ip] if now - t < 60
            ]

            if len(self.request_records[client_ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=429,
                    detail="API rate limit exceeded. Please wait a minute before submitting further AI triage requests."
                )

            self.request_records[client_ip].append(now)

        return await call_next(request)
