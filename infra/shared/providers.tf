# ============================================
# Galderma TrackWise AI Autopilot Demo
# Shared Terraform Provider Configuration
# ============================================
#
# AWS Configuration:
#   Account: 176545286005
#   Region: us-east-2
#   Profile: fabio-dev-lpd (local) or from environment (CI/CD)
# ============================================

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.28.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.0"
    }
  }
}

# ============================================
# AWS Provider Configuration
# ============================================
provider "aws" {
  region = var.aws_region

  # Use profile for local development, environment variables for CI/CD
  # Profile is only used if AWS_PROFILE env var is set or explicitly configured
  profile = var.aws_profile != "" ? var.aws_profile : null

  default_tags {
    tags = {
      Project     = "galderma-trackwise"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "demo-team"
      Application = "trackwise-ai-autopilot"
    }
  }
}

# ============================================
# Variables
# ============================================
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile (leave empty for CI/CD environment variables)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "galderma-trackwise"
}

# ============================================
# Local Values
# ============================================
locals {
  # Common naming prefix
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags (merged with provider default_tags)
  common_tags = {
    CreatedAt = timestamp()
  }

  # Agent names for resource creation
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

  # AgentCore Memory strategies
  memory_strategies = [
    "RecurringPatterns",
    "ResolutionTemplates",
    "PolicyKnowledge"
  ]
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ============================================
# Outputs (for use by other modules)
# ============================================
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

output "name_prefix" {
  description = "Common naming prefix for resources"
  value       = local.name_prefix
}

output "agent_names" {
  description = "List of agent names"
  value       = local.agent_names
}

output "memory_strategies" {
  description = "List of AgentCore Memory strategies"
  value       = local.memory_strategies
}
