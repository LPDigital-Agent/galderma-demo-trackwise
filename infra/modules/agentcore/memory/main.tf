# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Memory Module - 3 Memory Strategies
# ============================================
#
# This module creates AgentCore Memory with 3 strategies:
#   1. RecurringPatterns - Semantic memory for recurring complaint patterns
#   2. ResolutionTemplates - Episodic memory for successful resolutions
#   3. PolicyKnowledge - Semantic memory for compliance policies
#
# Uses AWS Provider v6.28.0+ with full AgentCore Memory support.
# ============================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.28.0"
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

variable "memory_strategies" {
  description = "Memory strategy configurations"
  type = map(object({
    type        = string # SEMANTIC or EPISODIC
    description = string
    retention   = string # LONG_TERM or PERMANENT
  }))
  default = {
    "RecurringPatterns" = {
      type        = "SEMANTIC"
      description = "Recurring complaint patterns for auto-classification"
      retention   = "LONG_TERM"
    }
    "ResolutionTemplates" = {
      type        = "EPISODIC"
      description = "Successful resolution templates for reuse"
      retention   = "LONG_TERM"
    }
    "PolicyKnowledge" = {
      type        = "SEMANTIC"
      description = "Compliance policy rules and guidelines"
      retention   = "PERMANENT"
    }
  }
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# IAM Role for Memory Access
# ============================================
resource "aws_iam_role" "memory_execution" {
  name = "${var.name_prefix}-memory-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "bedrock-agentcore.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.name_prefix}-memory-execution-role"
  }
}

# ============================================
# AgentCore Memory Resource
# ============================================
# Creates a unified memory store with multiple strategies
#
resource "aws_bedrockagentcore_memory" "main" {
  memory_name = "${var.name_prefix}-memory"
  description = "Unified memory for TrackWise AI Autopilot agents"

  # Execution role for memory operations
  role_arn = aws_iam_role.memory_execution.arn

  # Memory configuration
  memory_configuration {
    # Enable semantic search for pattern matching
    semantic_search_enabled = true

    # Embedding model for semantic memory
    embedding_model_id = "amazon.titan-embed-text-v2:0"

    # Vector store configuration
    vector_store_configuration {
      vector_store_type = "OPENSEARCH_SERVERLESS"
    }
  }

  # Memory strategies (defined as separate strategy resources below)
  # Note: Strategies may be defined inline or separately depending on API version

  tags = {
    Name        = "${var.name_prefix}-memory"
    Description = "Agent memory with 3 strategies"
  }
}

# ============================================
# Memory Strategies
# ============================================
# Note: Depending on the AgentCore API version, strategies might be
# defined inline in the memory resource or as separate resources.
# This uses the separate resource pattern for clarity.

resource "aws_bedrockagentcore_memory_strategy" "strategies" {
  for_each = var.memory_strategies

  memory_id     = aws_bedrockagentcore_memory.main.id
  strategy_name = each.key
  description   = each.value.description

  strategy_configuration {
    strategy_type = each.value.type

    # Retention policy
    retention_configuration {
      retention_type = each.value.retention
      # For LONG_TERM, keep for 1 year (365 days)
      retention_days = each.value.retention == "LONG_TERM" ? 365 : null
    }

    # Semantic configuration for pattern matching
    dynamic "semantic_configuration" {
      for_each = each.value.type == "SEMANTIC" ? [1] : []
      content {
        similarity_threshold = 0.75
        max_results          = 10
      }
    }

    # Episodic configuration for resolution templates
    dynamic "episodic_configuration" {
      for_each = each.value.type == "EPISODIC" ? [1] : []
      content {
        max_episodes     = 1000
        episode_ordering = "RECENCY" # Most recent first
      }
    }
  }

  tags = {
    Name     = "${var.name_prefix}-${each.key}"
    Strategy = each.key
    Type     = each.value.type
  }
}

# ============================================
# IAM Policy for Memory Operations
# ============================================
resource "aws_iam_role_policy" "memory_operations" {
  name = "memory-operations"
  role = aws_iam_role.memory_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockEmbedding"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0"
        ]
      },
      {
        Sid    = "OpenSearchServerless"
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = "*"
      }
    ]
  })
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

output "memory_endpoint" {
  description = "AgentCore Memory endpoint"
  value       = aws_bedrockagentcore_memory.main.memory_endpoint
}

output "strategy_ids" {
  description = "Map of strategy names to IDs"
  value       = { for k, v in aws_bedrockagentcore_memory_strategy.strategies : k => v.id }
}

output "memory_execution_role_arn" {
  description = "IAM role ARN for memory execution"
  value       = aws_iam_role.memory_execution.arn
}
