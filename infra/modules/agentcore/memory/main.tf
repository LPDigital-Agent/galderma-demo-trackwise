# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Memory Module - 3 Memory Strategies
# ============================================
#
# This module creates AgentCore Memory with 3 strategies:
#   1. RecurringPatterns - Semantic memory for recurring complaint patterns
#   2. ResolutionTemplates - Semantic memory for successful resolutions
#   3. PolicyKnowledge - Semantic memory for compliance policies
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
    Description = "Agent memory with 3 strategies"
  }
}

# ============================================
# Memory Strategies
# ============================================

# RecurringPatterns - Semantic memory for recurring complaint patterns
resource "aws_bedrockagentcore_memory_strategy" "recurring_patterns" {
  name        = "RecurringPatterns"
  memory_id   = aws_bedrockagentcore_memory.main.id
  type        = "SEMANTIC"
  description = "Recurring complaint patterns for auto-classification"
  namespaces  = ["recurring-patterns"]
}

# ResolutionTemplates - Semantic memory for successful resolutions
resource "aws_bedrockagentcore_memory_strategy" "resolution_templates" {
  name        = "ResolutionTemplates"
  memory_id   = aws_bedrockagentcore_memory.main.id
  type        = "SEMANTIC"
  description = "Successful resolution templates for reuse"
  namespaces  = ["resolution-templates"]
}

# PolicyKnowledge - Semantic memory for compliance policies
resource "aws_bedrockagentcore_memory_strategy" "policy_knowledge" {
  name        = "PolicyKnowledge"
  memory_id   = aws_bedrockagentcore_memory.main.id
  type        = "SEMANTIC"
  description = "Compliance policy rules and guidelines"
  namespaces  = ["policy-knowledge"]
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
    "RecurringPatterns"   = aws_bedrockagentcore_memory_strategy.recurring_patterns.memory_strategy_id
    "ResolutionTemplates" = aws_bedrockagentcore_memory_strategy.resolution_templates.memory_strategy_id
    "PolicyKnowledge"     = aws_bedrockagentcore_memory_strategy.policy_knowledge.memory_strategy_id
  }
}
