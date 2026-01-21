# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Memory Module - Unified Memory Strategy
# ============================================
#
# This module creates AgentCore Memory with a single semantic strategy.
# AgentCore only allows ONE strategy per type (semantic).
#
# Logical separation at application level:
#   - recurring-patterns: Recurring complaint patterns for auto-classification
#   - resolution-templates: Successful resolution templates for reuse
#   - policy-knowledge: Compliance policy rules and guidelines
#
# Uses AWS Provider with full AgentCore Memory support.
# Docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/bedrockagentcore_memory
# ============================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80.0"
    }
  }
}

# ============================================
# Variables
# ============================================
variable "name_prefix" {
  description = "Naming prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "event_expiry_days" {
  description = "Number of days after which memory events expire (7-365)"
  type        = number
  default     = 90
}

# ============================================
# Local Values
# ============================================
locals {
  # AgentCore names must match ^[a-zA-Z][a-zA-Z0-9_]{0,47}$ - max 48 chars, no hyphens
  # Use shortened prefix to stay within limits: gtw (galderma trackwise) + env
  short_prefix = "gtw_${var.environment}"
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# IAM Role for Memory Access
# ============================================
data "aws_iam_policy_document" "memory_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["bedrock-agentcore.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "memory_execution" {
  name               = "${var.name_prefix}-memory-execution-role"
  assume_role_policy = data.aws_iam_policy_document.memory_assume_role.json

  tags = {
    Name        = "${var.name_prefix}-memory-execution-role"
    Environment = var.environment
  }
}

# Attach managed policy for Bedrock model inference
resource "aws_iam_role_policy_attachment" "memory_bedrock" {
  role       = aws_iam_role.memory_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockAgentCoreMemoryBedrockModelInferenceExecutionRolePolicy"
}

# ============================================
# AgentCore Memory Resource
# ============================================
resource "aws_bedrockagentcore_memory" "main" {
  name                      = "${local.short_prefix}_memory"
  description               = "Unified memory for TrackWise AI Autopilot agents"
  event_expiry_duration     = var.event_expiry_days
  memory_execution_role_arn = aws_iam_role.memory_execution.arn

  tags = {
    Name        = "${var.name_prefix}-memory"
    Environment = var.environment
    Description = "Unified agent memory with semantic strategy"
  }
}

# ============================================
# Memory Strategy - Single Unified Semantic Strategy
# ============================================
# AgentCore only allows ONE semantic strategy per memory.
# Agents implement logical separation via data prefixes:
#   - "recurring:" for complaint patterns
#   - "resolution:" for resolution templates
#   - "policy:" for compliance knowledge
#
resource "aws_bedrockagentcore_memory_strategy" "unified" {
  name        = "TrackWiseKnowledge"
  memory_id   = aws_bedrockagentcore_memory.main.id
  type        = "SEMANTIC"
  description = "Unified semantic memory for all TrackWise agent knowledge"
  namespaces  = ["trackwise"]
}

# ============================================
# Outputs
# ============================================
output "memory_id" {
  description = "AgentCore Memory ID"
  value       = aws_bedrockagentcore_memory.main.id
}

output "memory_arn" {
  description = "AgentCore Memory ARN"
  value       = aws_bedrockagentcore_memory.main.arn
}

output "memory_execution_role_arn" {
  description = "IAM role ARN for memory execution"
  value       = aws_iam_role.memory_execution.arn
}

output "strategy_ids" {
  description = "Map of strategy names to IDs"
  value = {
    "TrackWiseKnowledge" = aws_bedrockagentcore_memory_strategy.unified.memory_strategy_id
  }
}

# Convenience output for agent code
output "unified_strategy_id" {
  description = "ID of the unified semantic strategy"
  value       = aws_bedrockagentcore_memory_strategy.unified.memory_strategy_id
}
