# ============================================
# Galderma TrackWise AI Autopilot Demo
# ============================================

.PHONY: help install dev test lint format clean infra deploy reset verify-aws

# Default target
help:
	@echo "Galderma TrackWise AI Autopilot Demo - Makefile"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Setup & Install:"
	@echo "  install          Install all dependencies (backend, agents, frontend)"
	@echo "  verify-aws       Verify AWS credentials and access"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start local development (all services)"
	@echo "  dev-backend      Start backend only"
	@echo "  dev-frontend     Start frontend only"
	@echo "  dev-agents       Start agents locally"
	@echo ""
	@echo "Testing:"
	@echo "  test             Run all tests"
	@echo "  test-backend     Run backend tests"
	@echo "  test-agents      Run agent tests"
	@echo "  test-frontend    Run frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint             Run linters on all code"
	@echo "  format           Format all code"
	@echo ""
	@echo "Infrastructure:"
	@echo "  infra-init       Initialize Terraform"
	@echo "  infra-plan       Plan infrastructure changes"
	@echo "  infra-apply      Apply infrastructure (dev)"
	@echo "  infra-destroy    Destroy infrastructure (dev)"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy           Deploy all components to AWS"
	@echo "  deploy-agents    Deploy agents to AgentCore"
	@echo "  deploy-frontend  Deploy frontend to S3/CloudFront"
	@echo ""
	@echo "Demo:"
	@echo "  reset            Reset demo data"
	@echo "  seed             Seed demo data"
	@echo ""
	@echo "Utilities:"
	@echo "  clean            Clean build artifacts"

# ----------------------------------------
# AWS Configuration
# ----------------------------------------
AWS_PROFILE ?= fabio-dev-lpd
AWS_REGION ?= us-east-2
AWS_ACCOUNT_ID ?= 176545286005

export AWS_PROFILE
export AWS_REGION
export AWS_ACCOUNT_ID

# ----------------------------------------
# Setup & Install
# ----------------------------------------
install:
	@echo "Installing backend dependencies..."
	cd backend && uv sync
	@echo "Installing agent dependencies..."
	cd agents && uv sync
	@echo "Installing frontend dependencies..."
	cd frontend && pnpm install
	@echo "All dependencies installed!"

verify-aws:
	@echo "Verifying AWS credentials..."
	./scripts/verify-aws.sh

# ----------------------------------------
# Development
# ----------------------------------------
dev: verify-aws
	@echo "Starting local development..."
	docker-compose up -d
	@echo "Services started. Access:"
	@echo "  Backend: http://localhost:8080"
	@echo "  Frontend: http://localhost:5173"

dev-backend:
	cd backend && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

dev-frontend:
	cd frontend && pnpm dev

dev-agents:
	@echo "Starting agents locally (requires AgentCore CLI)..."
	@for agent in observer case_understanding recurring_detector compliance_guardian resolution_composer inquiry_bridge writeback memory_curator csv_pack; do \
		echo "Starting $$agent..."; \
		cd agents/$$agent && agentcore launch --local & \
		cd ../..; \
	done

# ----------------------------------------
# Testing
# ----------------------------------------
test: test-backend test-agents test-frontend
	@echo "All tests completed!"

test-backend:
	@echo "Running backend tests..."
	cd backend && uv run pytest -v

test-agents:
	@echo "Running agent tests..."
	cd agents && uv run pytest -v

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && pnpm test

# ----------------------------------------
# Code Quality
# ----------------------------------------
lint:
	@echo "Linting backend..."
	cd backend && uv run ruff check .
	@echo "Linting agents..."
	cd agents && uv run ruff check .
	@echo "Linting frontend..."
	cd frontend && pnpm lint

format:
	@echo "Formatting backend..."
	cd backend && uv run ruff format .
	@echo "Formatting agents..."
	cd agents && uv run ruff format .
	@echo "Formatting frontend..."
	cd frontend && pnpm format

# ----------------------------------------
# Infrastructure (Terraform)
# ----------------------------------------
TERRAFORM_DIR ?= infra/environments/dev

infra-init:
	@echo "Initializing Terraform..."
	cd $(TERRAFORM_DIR) && terraform init

infra-plan:
	@echo "Planning infrastructure changes..."
	cd $(TERRAFORM_DIR) && terraform plan

infra-apply:
	@echo "Applying infrastructure..."
	cd $(TERRAFORM_DIR) && terraform apply

infra-destroy:
	@echo "Destroying infrastructure..."
	cd $(TERRAFORM_DIR) && terraform destroy

# ----------------------------------------
# Deployment
# ----------------------------------------
deploy: deploy-agents deploy-frontend
	@echo "Deployment complete!"

deploy-agents:
	@echo "Deploying agents to AgentCore..."
	@for agent in observer case_understanding recurring_detector compliance_guardian resolution_composer inquiry_bridge writeback memory_curator csv_pack; do \
		echo "Deploying $$agent..."; \
		cd agents/$$agent && agentcore configure --entrypoint agent.py && agentcore launch; \
		cd ../..; \
	done

deploy-frontend:
	@echo "Building and deploying frontend..."
	cd frontend && pnpm build
	@echo "Syncing to S3..."
	aws s3 sync frontend/dist s3://galderma-trackwise-frontend-$(AWS_ACCOUNT_ID)/ --delete

# ----------------------------------------
# Demo Data
# ----------------------------------------
reset:
	@echo "Resetting demo data..."
	./scripts/reset-demo.sh

seed:
	@echo "Seeding demo data..."
	./scripts/seed-demo.sh

# ----------------------------------------
# Utilities
# ----------------------------------------
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".venv" -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/dist
	@echo "Clean complete!"
