import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.db.session import init_db, get_active_db_type
from backend.app.api.routes import complaints, analytics, health, demo
from backend.app.middleware.request_id import RequestIDMiddleware
from backend.app.middleware.logging_middleware import StructuredLoggingMiddleware
from backend.app.middleware.rate_limit import RateLimitMiddleware
from backend.app.middleware.idempotency import IdempotencyMiddleware
from backend.app.api.v1.api import api_v1_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aivoa-backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    init_db()
    logger.info(f"Active database engine: {get_active_db_type()}")
    logger.info(f"AI Engine model: {settings.GROQ_MODEL} (Groq Key Configured: {bool(settings.GROQ_API_KEY)})")
    yield
    logger.info("Gracefully shutting down backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# --- MIDDLEWARE PIPELINE ---
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(IdempotencyMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests_per_minute=120)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL STANDARDIZED ERROR HANDLERS ---
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", None)
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        body = dict(exc.detail)
        body["error"]["request_id"] = req_id
        if "detail" not in body:
            body["detail"] = body["error"].get("message", "Error")
        return JSONResponse(status_code=exc.status_code, content=body, headers={"X-Request-ID": req_id} if req_id else None)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "request_id": req_id
            }
        },
        headers={"X-Request-ID": req_id} if req_id else None
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The submitted payload failed schema validation.",
                "details": exc.errors(),
                "request_id": req_id
            }
        },
        headers={"X-Request-ID": req_id} if req_id else None
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None)
    logger.exception(f"Unhandled exception on [{request.method}] {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Quality operations team notified.",
                "request_id": req_id
            }
        },
        headers={"X-Request-ID": req_id} if req_id else None
    )

# --- REGISTER API ROUTERS (v1 and backward-compatible /api) ---
app.include_router(api_v1_router, prefix="/api/v1")
app.include_router(health.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(demo.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
