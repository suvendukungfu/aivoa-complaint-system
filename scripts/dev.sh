#!/usr/bin/env bash
# ==============================================================================
# AIVOA - Local Development Startup Script
# Starts FastAPI backend (port 8000) and React frontend (port 5173) concurrently
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================================"
echo "🚀 STARTING AIVOA PHARMACEUTICAL QUALITY COMPLAINT SYSTEM"
echo "========================================================================"

# Check Python environment
if [ -f "backend/.venv/bin/uvicorn" ]; then
    PYTHON_EXEC="backend/.venv/bin/python"
    UVICORN_EXEC="backend/.venv/bin/uvicorn"
else
    PYTHON_EXEC="python"
    UVICORN_EXEC="uvicorn"
fi

# Trap SIGINT / SIGTERM to cleanly kill background subprocesses
cleanup() {
    echo -e "\n🛑 Shutting down AIVOA development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend
echo "📦 [1/2] Launching FastAPI Backend on http://127.0.0.1:8000..."
$UVICORN_EXEC backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait briefly for backend port
sleep 2

# 2. Start Frontend
echo "💻 [2/2] Launching Vite Frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "========================================================================"
echo "✅ AIVOA SERVICES RUNNING:"
echo "• Frontend UI:       http://localhost:5173"
echo "• Backend OpenAPI:   http://127.0.0.1:8000/docs"
echo "• Review Cockpit:    http://localhost:5173 (Quality Review tab)"
echo "• Health Probe:      http://127.0.0.1:8000/api/v1/health"
echo "========================================================================"
echo "Press Ctrl+C to terminate both servers."

wait
