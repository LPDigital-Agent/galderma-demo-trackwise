# GitHub Actions Workflows

This directory contains CI/CD workflows for the Galderma TrackWise AI Autopilot Demo.

## Workflows Overview

### 1. CI (`ci.yml`)
**Trigger:** Push/PR to `main` or `develop`

Runs continuous integration checks:
- **Backend Tests**: Python linting (ruff), type checking (mypy), pytest
- **Agents Tests**: Python linting, type checking, pytest
- **Frontend Tests**: ESLint, TypeScript checking, Vitest, production build
- **Terraform Validate**: Format checking and validation

### 2. Deploy Infrastructure (`deploy-infra.yml`)
**Trigger:** Push to `main` (infra changes) or manual dispatch

Deploys AWS infrastructure:
1. Runs Terraform apply for DynamoDB, S3, CloudWatch, ECR
2. Creates AgentCore Memory strategies (RecurringPatterns, ResolutionTemplates, PolicyKnowledge)

### 3. Deploy Agents (`deploy-agents.yml`)
**Trigger:** Push to `main` (agents/backend changes) or manual dispatch

Deploys all components to **AgentCore Runtime** (100% - ZERO Lambda/ECS):
1. Builds ARM64 container images
2. Pushes to ECR
3. Deploys via `agentcore launch`
4. Verifies A2A communication

**Components deployed:**
- TrackWise Simulator
- Observer (orchestrator)
- Case Understanding
- Recurring Detector
- Compliance Guardian (OPUS)
- Resolution Composer (OPUS)
- Inquiry Bridge
- Writeback
- Memory Curator
- CSV Pack

### 4. Deploy Frontend (`deploy-frontend.yml`)
**Trigger:** Push to `main` (frontend changes) or manual dispatch

Deploys React frontend:
1. Builds production bundle
2. Syncs to S3
3. Invalidates CloudFront cache

## Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for account 176545286005 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key |

## Required Variables

Configure these in **Settings → Secrets and variables → Actions → Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_URL` | Backend API URL | `https://api.galderma-demo.com` |
| `WS_URL` | WebSocket URL | `wss://api.galderma-demo.com` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890ABC` |
| `CLOUDFRONT_URL` | CloudFront domain | `https://demo.galderma.com` |

## Manual Deployment

### Deploy specific agent
```yaml
# Go to Actions → Deploy Agents → Run workflow
# Select agent from dropdown
```

### Deploy to specific environment
```yaml
# Go to Actions → Deploy Infrastructure → Run workflow
# Select environment: dev or prod
```

## Architecture Note

**CRITICAL**: All agents deploy to **AgentCore Runtime**. This project uses:
- ✅ 100% AWS Bedrock AgentCore Runtime
- ❌ ZERO AWS Lambda
- ❌ ZERO AWS ECS/Fargate
- ❌ ZERO AWS API Gateway (traditional)

The deployment uses `agentcore configure` + `agentcore launch` from the Bedrock AgentCore Starter Toolkit.
