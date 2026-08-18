#!/usr/bin/env bash
# ==============================================================================
# AIVOA - Comprehensive Test Runner Script
# Executes backend unit/integration tests and frontend Vitest component tests
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================================"
echo "🧪 AIVOA COMPREHENSIVE AUTOMATED TEST RUNNER"
echo "========================================================================"

# Check Python environment
if [ -f "backend/.venv/bin/pytest" ]; then
    PYTEST_EXEC="backend/.venv/bin/pytest"
else
    PYTEST_EXEC="pytest"
fi

echo "📦 [1/2] Executing Backend Test Suites (FastAPI, LangGraph, Concurrency, RBAC, Security)..."
$PYTEST_EXEC backend/tests/ -v

echo -e "\n💻 [2/2] Executing Frontend Test Suites (React 19, Vitest, Review Workspaces)..."
cd frontend
npm test -- --run

echo -e "\n========================================================================"
echo "🎉 ALL TEST SUITES PASSED (100% SUCCESS RATE)"
echo "========================================================================"
