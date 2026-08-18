# ==============================================================================
# AIVOA Pharmaceutical Complaint Management System - Makefile
# ==============================================================================

.PHONY: help dev test lint build eval e2e prod clean docker-build

PYTHON ?= backend/.venv/bin/python
PYTEST ?= backend/.venv/bin/pytest
NPM ?= npm

help:
	@echo "========================================================================"
	@echo "⚡ AIVOA PHARMACEUTICAL QUALITY COMPLAINT MANAGEMENT SYSTEM"
	@echo "========================================================================"
	@echo "Available commands:"
	@echo "  make dev          - Start both backend and frontend development servers"
	@echo "  make test         - Run all backend and frontend automated test suites"
	@echo "  make lint         - Run linting and TypeScript validation"
	@echo "  make build        - Build production frontend bundle"
	@echo "  make eval         - Run AI evaluation quality gate (evaluation/runner.py)"
	@echo "  make real-eval    - Run real Groq LLM verification runner"
	@echo "  make e2e          - Run canonical end-to-end integration test"
	@echo "  make load-test    - Run concurrent performance and load tests"
	@echo "  make prod         - Launch production containers with docker-compose"
	@echo "  make clean        - Remove caches, temp files, and test artifacts"
	@echo "========================================================================"

dev:
	@bash scripts/dev.sh

test:
	@bash scripts/test.sh

lint:
	@echo "🔍 Running Frontend TypeScript & Lint Checks..."
	@cd frontend && $(NPM) run lint || true
	@echo "🔍 Running Backend Tests Syntax Check..."
	@$(PYTHON) -m py_compile backend/app/main.py
	@echo "✅ All lint and compile checks completed."

build:
	@echo "📦 Building Frontend Production Bundle..."
	@cd frontend && $(NPM) run build
	@echo "✅ Production bundle built successfully in frontend/dist."

eval:
	@echo "🔬 Running AI Quality CI Evaluation Gate..."
	@$(PYTHON) evaluation/runner.py

real-eval:
	@echo "🔬 Running Real Groq LLM Verification Runner..."
	@$(PYTHON) evaluation/real_llm_runner.py --limit 5

e2e:
	@echo "🧪 Running Canonical Flagship E2E Test..."
	@$(PYTEST) backend/tests/test_e2e_hitl_demo.py -v

load-test:
	@echo "🚀 Running Performance & Load Benchmarks..."
	@$(PYTHON) backend/tests/load_test.py

prod:
	@echo "🐳 Launching Production Docker Containers..."
	@docker compose -f docker-compose.prod.yml up -d --build

clean:
	@echo "🧹 Cleaning up temporary cache files..."
	@rm -rf .pytest_cache backend/**/__pycache__ evaluation/**/__pycache__
	@rm -rf frontend/dist
	@echo "✅ Clean complete."
