# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Gateway Module - MCP/A2A Routing
# ============================================
#
# This module creates an AgentCore Gateway for:
#   - MCP protocol routing (tools/list, tools/call)
#   - A2A protocol communication between agents
#
# Uses AWS Provider with full AgentCore Gateway support.
# Docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/bedrockagentcore_gateway
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

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# IAM Role for Gateway Execution
# ============================================
data "aws_iam_policy_document" "gateway_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["bedrock-agentcore.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "gateway_execution" {
  name               = "${var.name_prefix}-gateway-execution-role"
  assume_role_policy = data.aws_iam_policy_document.gateway_assume_role.json

  tags = {
    Name        = "${var.name_prefix}-gateway-execution-role"
    Environment = var.environment
  }
}

# IAM Policy for Gateway Operations
resource "aws_iam_role_policy" "gateway_operations" {
  name = "gateway-operations"
  role = aws_iam_role.gateway_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "InvokeAgentRuntimes"
        Effect = "Allow"
        Action = [
          "bedrock-agentcore:InvokeAgentRuntime"
        ]
        Resource = "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent-runtime/*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/agentcore/*"
      }
    ]
  })
}

# ============================================
# AgentCore Gateway Resource
# ============================================
resource "aws_bedrockagentcore_gateway" "main" {
  name        = "${var.name_prefix}-gateway"
  description = "MCP Gateway for TrackWise AI Autopilot"
  role_arn    = aws_iam_role.gateway_execution.arn

  # Using AWS_IAM for demo (no external OAuth needed)
  authorizer_type = "AWS_IAM"

  # MCP Protocol configuration
  protocol_type = "MCP"

  protocol_configuration {
    mcp {
      instructions       = "Gateway for TrackWise AI Autopilot MCP requests"
      search_type        = "SEMANTIC"
      supported_versions = ["2025-03-26"]
    }
  }

  tags = {
    Name        = "${var.name_prefix}-gateway"
    Environment = var.environment
    Description = "MCP Gateway for agent communication"
  }
}

# ============================================
# Outputs
# ============================================
output "gateway_id" {
  description = "AgentCore Gateway ID"
  value       = aws_bedrockagentcore_gateway.main.gateway_id
}

output "gateway_arn" {
  description = "AgentCore Gateway ARN"
  value       = aws_bedrockagentcore_gateway.main.gateway_arn
}

output "gateway_url" {
  description = "AgentCore Gateway endpoint URL"
  value       = aws_bedrockagentcore_gateway.main.gateway_url
}

output "gateway_execution_role_arn" {
  description = "IAM role ARN for gateway execution"
  value       = aws_iam_role.gateway_execution.arn
}
