# ============================================
# Galderma TrackWise AI Autopilot Demo
# Development Environment - Main Configuration
# ============================================
#
# This file orchestrates all infrastructure modules for the dev environment.
#
# Architecture:
#   - 100% AWS Bedrock AgentCore (ZERO ECS, ZERO Lambda, ZERO ECR containers)
#   - 9 Strands Agents on AgentCore Runtime (code via S3 ZIP)
#   - AgentCore Memory with 3 strategies
#   - AgentCore Gateway for MCP/A2A
#   - AgentCore Identity with workload tokens
#
# AWS Configuration:
#   - Account: 176545286005
#   - Region: us-east-2
#   - Profile: fabio-dev-lpd (local development)
# ============================================

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.28.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  # Backend configuration for state storage
  # Uncomment for remote state management
  # backend "s3" {
  #   bucket         = "galderma-trackwise-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-2"
  #   encrypt        = true
  #   dynamodb_table = "galderma-trackwise-terraform-locks"
  # }
}

# ============================================
# Provider Configuration
# ============================================
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile != "" ? var.aws_profile : null

  default_tags {
    tags = {
      Project     = "galderma-trackwise"
      Environment = "dev"
      ManagedBy   = "terraform"
      Owner       = "demo-team"
    }
  }
}

# ============================================
# Variables
# ============================================
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile (empty for CI/CD)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "galderma-trackwise"
}

# ============================================
# Local Values
# ============================================
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  agent_names = [
    "observer",
    "case-understanding",
    "recurring-detector",
    "compliance-guardian",
    "resolution-composer",
    "inquiry-bridge",
    "writeback",
    "memory-curator",
    "csv-pack"
  ]
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================
# Module: DynamoDB Tables
# ============================================
module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix                   = local.name_prefix
  environment                   = var.environment
  enable_point_in_time_recovery = true
  deletion_protection_enabled   = false # Allow deletion in dev
}

# ============================================
# Module: S3 Buckets
# ============================================
module "s3" {
  source = "../../modules/s3"

  name_prefix       = local.name_prefix
  environment       = var.environment
  aws_account_id    = data.aws_caller_identity.current.account_id
  enable_versioning = true
  enable_encryption = true
}

# ============================================
# Module: CloudWatch Observability
# ============================================
module "cloudwatch" {
  source = "../../modules/cloudwatch"

  name_prefix        = local.name_prefix
  environment        = var.environment
  agent_names        = local.agent_names
  log_retention_days = 30
}

# ============================================
# Module: AgentCore Memory
# ============================================
module "agentcore_memory" {
  source = "../../modules/agentcore/memory"

  name_prefix = local.name_prefix
  environment = var.environment
  aws_region  = var.aws_region
}

# ============================================
# Module: AgentCore Identity
# ============================================
module "agentcore_identity" {
  source = "../../modules/agentcore/identity"

  name_prefix = local.name_prefix
  environment = var.environment
  aws_region  = var.aws_region
  agent_names = local.agent_names
}

# ============================================
# Module: AgentCore Gateway
# ============================================
module "agentcore_gateway" {
  source = "../../modules/agentcore/gateway"

  name_prefix = local.name_prefix
  environment = var.environment
  aws_region  = var.aws_region
}

# Note: AgentCore Policy Engine is not yet available in Terraform AWS provider.
# Policy enforcement will be implemented via SDK/CLI when available.

# ============================================
# Module: AgentCore Runtime (Agents)
# ============================================
# Code deployment: S3 ZIP files (NOT containers!)
# GitHub Actions will upload agent.zip to s3://artifacts/agents/{agent-name}/agent.zip
module "agentcore_runtime" {
  source = "../../modules/agentcore/runtime"

  name_prefix           = local.name_prefix
  environment           = var.environment
  aws_region            = var.aws_region
  artifacts_bucket_name = module.s3.artifacts_bucket_name
  memory_id             = module.agentcore_memory.memory_id
  gateway_url           = module.agentcore_gateway.gateway_url
  dynamodb_table_arns   = module.dynamodb.all_table_arns
  s3_bucket_arns        = module.s3.all_bucket_arns
  log_group_arns        = module.cloudwatch.all_log_group_arns

  depends_on = [
    module.agentcore_memory,
    module.agentcore_gateway,
    module.dynamodb,
    module.s3,
    module.cloudwatch
  ]
}

# ============================================
# Outputs
# ============================================

# AWS Account Info
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

# DynamoDB
output "dynamodb_table_names" {
  description = "DynamoDB table names"
  value = {
    runs   = module.dynamodb.runs_table_name
    ledger = module.dynamodb.ledger_table_name
    cases  = module.dynamodb.cases_table_name
  }
}

# S3
output "s3_bucket_names" {
  description = "S3 bucket names"
  value = {
    artifacts = module.s3.artifacts_bucket_name
    csv_packs = module.s3.csv_packs_bucket_name
    frontend  = module.s3.frontend_bucket_name
  }
}

# AgentCore Memory
output "agentcore_memory_id" {
  description = "AgentCore Memory ID"
  value       = module.agentcore_memory.memory_id
}

output "agentcore_memory_arn" {
  description = "AgentCore Memory ARN"
  value       = module.agentcore_memory.memory_arn
}

output "agentcore_memory_strategies" {
  description = "AgentCore Memory Strategy IDs"
  value       = module.agentcore_memory.strategy_ids
}

# AgentCore Gateway
output "agentcore_gateway_id" {
  description = "AgentCore Gateway ID"
  value       = module.agentcore_gateway.gateway_id
}

output "agentcore_gateway_arn" {
  description = "AgentCore Gateway ARN"
  value       = module.agentcore_gateway.gateway_arn
}

output "agentcore_gateway_url" {
  description = "AgentCore Gateway URL"
  value       = module.agentcore_gateway.gateway_url
}

# AgentCore Runtime
output "agentcore_agent_runtime_arns" {
  description = "AgentCore Agent Runtime ARNs"
  value       = module.agentcore_runtime.agent_runtime_arns
}

output "agentcore_agent_runtime_ids" {
  description = "AgentCore Agent Runtime IDs"
  value       = module.agentcore_runtime.agent_runtime_ids
}

output "agentcore_agent_endpoint_arns" {
  description = "AgentCore Agent Runtime Endpoint ARNs"
  value       = module.agentcore_runtime.agent_endpoint_arns
}

output "agentcore_orchestrator_arn" {
  description = "Observer (orchestrator) agent ARN"
  value       = module.agentcore_runtime.orchestrator_arn
}

# AgentCore Identity
output "agentcore_workload_identity_arns" {
  description = "Workload identity ARNs for agents"
  value       = module.agentcore_identity.workload_identity_arns
}

# CloudWatch
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = module.cloudwatch.dashboard_name
}

# Frontend
output "frontend_website_endpoint" {
  description = "Frontend S3 website endpoint"
  value       = module.s3.frontend_bucket_website_endpoint
}
