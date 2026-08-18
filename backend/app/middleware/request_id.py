import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware attaching X-Request-ID correlation headers to incoming and outgoing HTTP requests"""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:8]}"
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
