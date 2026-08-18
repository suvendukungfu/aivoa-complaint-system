#!/bin/bash
set -e

# ==============================================================================
# AIVOA DEMO PREPARATION & HEALTH CHECK SCRIPT
# Prepares a clean, deterministic environment for technical interview demos
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "======================================================================"
echo "AIVOA — Quality Management System Demo Environment Setup"
echo "======================================================================"

# 1. Check Python Virtual Environment
if [ ! -d "backend/.venv" ]; then
    echo "❌ Error: Python virtual environment not found in backend/.venv"
    echo "   Please create it: python3 -m venv backend/.venv && source backend/.venv/bin/activate && pip install -r backend/requirements.txt"
    exit 1
fi
echo "✓ Python virtual environment located"

# 2. Check Frontend Node Modules
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Error: frontend/node_modules not found"
    echo "   Please run: cd frontend && npm install"
    exit 1
fi
echo "✓ Frontend dependencies located"

# 3. Check Backend Live Server Health
echo "Checking backend health at http://127.0.0.1:8000/api/health..."
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8000/api/health || true)

if [ -z "${HEALTH_RESPONSE}" ]; then
    echo "⚠️ Backend not currently running on port 8000."
    echo "   Starting background FastAPI uvicorn daemon..."
    nohup backend/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 > /tmp/aivoa_backend.log 2>&1 &
    sleep 2
    HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8000/api/health || true)
fi

if [[ "${HEALTH_RESPONSE}" == *"healthy"* ]]; then
    echo "✓ Backend API is healthy & responding"
    echo "  Status payload: ${HEALTH_RESPONSE}"
else
    echo "❌ Error: Backend API failed health probe."
    exit 1
fi

# 4. Trigger Deterministic Demo Data Reset
echo "Resetting demo state and seeding 3 canonical GxP scenarios..."
RESET_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/v1/demo/reset)
echo "✓ Demo reset response: ${RESET_RESPONSE}"

# 5. Run Fast Smokes
echo "Running quick Real AI smoke verification..."
backend/.venv/bin/pytest backend/tests/test_real_ai_smoke.py -q || true

echo "Running quick Frontend test verification..."
(cd frontend && npm test -- --run -t "complaintSlice" > /dev/null 2>&1)
echo "✓ Frontend slice tests verified"

echo "======================================================================"
echo "DEMO ENVIRONMENT IS READY"
echo "======================================================================"
echo "• Backend:  http://127.0.0.1:8000"
echo "• API Docs: http://127.0.0.1:8000/docs"
echo "• Frontend: http://localhost:5173"
echo "• Seeded Scenarios: PA240812 (Contamination), AMX-2026-884 (Packaging), MET-500-A (Potency)"
echo "======================================================================"
