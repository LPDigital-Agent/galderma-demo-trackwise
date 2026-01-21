# Development Commands

## Prerequisites
- Python 3.12+
- Node.js 20+
- Terraform 1.7+
- Docker 24+
- uv (Python package manager)
- pnpm (Node package manager)

## AWS Configuration
```bash
# Configure AWS CLI profile for demo account
aws configure --profile galderma-demo

# Expected:
# Region: us-east-2
# Account: 176545286005

# Verify access
aws sts get-caller-identity --profile galderma-demo
```

## Install Dependencies
```bash
# Backend
cd backend && uv sync && cd ..

# Agents
cd agents && uv sync && cd ..

# Frontend
cd frontend && pnpm install && cd ..
```

## Start Local Development
```bash
# Start databases
docker-compose up -d db redis

# Start backend
cd backend && uv run uvicorn src.main:app --reload &

# Start frontend
cd frontend && pnpm dev
```

## Run Tests
```bash
# Backend
cd backend && uv run pytest

# Agents
cd agents && uv run pytest

# Frontend
cd frontend && pnpm test
```

## Lint Code
```bash
# Backend
cd backend && uv run ruff check .

# Agents
cd agents && uv run ruff check .

# Frontend
cd frontend && pnpm lint
```

## Database Operations
```bash
# Run migrations
cd backend && uv run alembic upgrade head

# Seed test data
cd backend && uv run python scripts/seed_data.py
```

## Infrastructure (Terraform)
```bash
# Initialize
cd infra/environments/dev && terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy (careful!)
terraform destroy
```

## Reset Demo Data
```bash
./scripts/reset-demo.sh
```

## Make Targets (if Makefile exists)
```bash
make install      # Install all dependencies
make dev          # Start local development
make test         # Run all tests
make lint         # Lint all code
make build        # Build for production
make db-migrate   # Database migrations
make db-seed      # Seed test data
make reset-demo   # Reset demo data
make deploy-infra # Deploy infrastructure
```

## System Commands (Darwin/macOS)
```bash
# Find files
find . -name "*.py" -type f

# Search in files
grep -r "pattern" --include="*.py" .

# List directory
ls -la

# Check disk space
df -h

# Process management
ps aux | grep python

# Git operations
git status
git diff
git log --oneline -10
```
