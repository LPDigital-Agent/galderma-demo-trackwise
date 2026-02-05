# Infrastructure — Terraform on AWS

## Purpose
All AWS infrastructure managed via Terraform. Two environments (dev, prod) with shared modules.

## Stack
- **IaC:** Terraform 1.7+ (ONLY — no CloudFormation/SAM)
- **State:** S3 backend + DynamoDB locking
- **CI/CD:** GitHub Actions (no local deploys to prod)

## Key Paths
- `environments/dev/` — Dev environment root module
- `environments/prod/` — Prod environment root module
- `modules/` — Reusable Terraform modules
- `shared/` — Shared config, remote state data sources

## AWS Config
- Account: `176545286005`
- Region: `us-east-2` (Ohio) — ALWAYS
- CLI Profile: galderma-demo

## Commands
```bash
cd environments/dev && terraform init     # initialize
cd environments/dev && terraform plan     # preview changes
cd environments/dev && terraform apply    # apply (dev only)
```

## Key Services
- **Bedrock AgentCore:** Agent runtime, memory, gateway, observability
- **Cognito:** Authentication (NO Amplify)
- **DynamoDB:** Single-table design, define GSIs upfront
- **S3:** Frontend hosting, artifacts, state backend
- **Lambda:** ONLY as AgentCore execution substrate
- **API Gateway:** HTTP API (not REST API)

## Rules
- Tag all resources: `Project=galderma-trackwise`, `Environment={dev|prod}`
- SSM Parameter Store for secrets (never env vars)
- IAM least privilege — scope to specific resources
- terraform plan BEFORE every apply
- See @docs/IMMUTABLE_RULES.md for security requirements
