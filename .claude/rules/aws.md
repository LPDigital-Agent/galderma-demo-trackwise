---
paths:
  - "**/infra/**"
  - "**/terraform/**"
  - "**/*.tf"
  - "**/*.tfvars"
  - "**/deploy*"
  - "**/lambda/**"
---

# AWS & Terraform Rules (Galderma TrackWise)

## Terraform
- Modules for reusable components
- S3 backend + DynamoDB locking for state
- Define GSIs upfront for DynamoDB tables
- Tag: Project=galderma-trackwise, Environment={dev|prod}

## AgentCore
- Deploy agents via AgentCore Runtime
- Memory via managed STM/LTM strategies
- MCP tools via AgentCore Gateway only

## Lambda
- Python 3.12, minimum 256MB
- ONLY as AgentCore execution substrate

## Security
- SSM Parameter Store for secrets
- IAM least privilege, resource-scoped
- S3 versioning on prod buckets
- HTTP API (not REST API) for new endpoints
