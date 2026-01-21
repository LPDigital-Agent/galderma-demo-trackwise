# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Runtime Module - Agent Deployment
# ============================================
#
# This module deploys all 9 agents to AWS Bedrock AgentCore Runtime.
#
# Architecture:
#   - Observer (Orchestrator) with A2A permissions to invoke specialists
#   - 8 Specialist agents with individual IAM roles
#   - Multi-Agent Orchestrator Pattern via IAM-based A2A
#   - Code deployed via S3 ZIP files (NOT containers!)
#
# Docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/bedrockagentcore_agent_runtime
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

variable "artifacts_bucket_name" {
  description = "S3 bucket name for agent code artifacts (ZIP files)"
  type        = string
}

variable "memory_id" {
  description = "AgentCore Memory ID for agent access"
  type        = string
}

variable "gateway_url" {
  description = "AgentCore Gateway URL"
  type        = string
}

variable "dynamodb_table_arns" {
  description = "ARNs of DynamoDB tables for agent access"
  type        = list(string)
}

variable "s3_bucket_arns" {
  description = "ARNs of S3 buckets for agent access"
  type        = list(string)
}

variable "log_group_arns" {
  description = "ARNs of CloudWatch log groups"
  type        = list(string)
}

variable "python_runtime" {
  description = "Python runtime version for agents"
  type        = string
  default     = "PYTHON_3_12"
}

# Agent configurations
variable "agents" {
  description = "Configuration for each agent"
  type = map(object({
    model_id        = string
    description     = string
    entry_point     = list(string)
    memory_access   = list(string) # READ, WRITE, or both
    is_orchestrator = bool
  }))
  default = {
    "observer" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Orchestrator agent - routes events to specialists"
      entry_point     = ["main.py"]
      memory_access   = []
      is_orchestrator = true
    }
    "case-understanding" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Analyzes and classifies TrackWise cases"
      entry_point     = ["main.py"]
      memory_access   = ["READ"]
      is_orchestrator = false
    }
    "recurring-detector" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Detects recurring patterns in complaints"
      entry_point     = ["main.py"]
      memory_access   = ["READ", "WRITE"]
      is_orchestrator = false
    }
    "compliance-guardian" = {
      model_id        = "anthropic.claude-opus-4-5-20251101"
      description     = "Validates compliance with 5 policy rules"
      entry_point     = ["main.py"]
      memory_access   = ["READ"]
      is_orchestrator = false
    }
    "resolution-composer" = {
      model_id        = "anthropic.claude-opus-4-5-20251101"
      description     = "Composes multilingual resolutions"
      entry_point     = ["main.py"]
      memory_access   = ["READ"]
      is_orchestrator = false
    }
    "inquiry-bridge" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Handles inquiry-linked complaints"
      entry_point     = ["main.py"]
      memory_access   = ["READ"]
      is_orchestrator = false
    }
    "writeback" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Executes writeback to TrackWise Simulator"
      entry_point     = ["main.py"]
      memory_access   = ["WRITE"]
      is_orchestrator = false
    }
    "memory-curator" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Manages memory updates from feedback"
      entry_point     = ["main.py"]
      memory_access   = ["READ", "WRITE"]
      is_orchestrator = false
    }
    "csv-pack" = {
      model_id        = "anthropic.claude-haiku-4-5-20251101"
      description     = "Generates CSV compliance packs"
      entry_point     = ["main.py"]
      memory_access   = ["READ"]
      is_orchestrator = false
    }
  }
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================
# IAM Role for Agent Execution
# ============================================
data "aws_iam_policy_document" "agent_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["bedrock-agentcore.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "agent_execution" {
  for_each = var.agents

  name               = "${var.name_prefix}-${each.key}-execution-role"
  assume_role_policy = data.aws_iam_policy_document.agent_assume_role.json

  tags = {
    Name        = "${var.name_prefix}-${each.key}-execution-role"
    Agent       = each.key
    Environment = var.environment
  }
}

# ============================================
# IAM Policy - S3 Artifacts Access (for code deployment)
# ============================================
data "aws_iam_policy_document" "s3_artifacts_access" {
  statement {
    sid    = "S3ArtifactsRead"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion"
    ]
    resources = [
      "arn:aws:s3:::${var.artifacts_bucket_name}/*"
    ]
  }
}

resource "aws_iam_role_policy" "s3_artifacts_access" {
  for_each = var.agents

  name   = "${each.key}-s3-artifacts-access"
  role   = aws_iam_role.agent_execution[each.key].id
  policy = data.aws_iam_policy_document.s3_artifacts_access.json
}

# ============================================
# IAM Policy - Bedrock Model Access
# ============================================
resource "aws_iam_role_policy" "bedrock_access" {
  for_each = var.agents

  name = "${each.key}-bedrock-access"
  role = aws_iam_role.agent_execution[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockModelAccess"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/${each.value.model_id}"
        ]
      }
    ]
  })
}

# ============================================
# IAM Policy - AgentCore Memory Access
# ============================================
resource "aws_iam_role_policy" "memory_access" {
  for_each = { for k, v in var.agents : k => v if length(v.memory_access) > 0 }

  name = "${each.key}-memory-access"
  role = aws_iam_role.agent_execution[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      contains(each.value.memory_access, "READ") ? [
        {
          Sid    = "MemoryRead"
          Effect = "Allow"
          Action = [
            "bedrock-agentcore:QueryMemory",
            "bedrock-agentcore:GetMemory"
          ]
          Resource = "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:memory/${var.memory_id}"
        }
      ] : [],
      contains(each.value.memory_access, "WRITE") ? [
        {
          Sid    = "MemoryWrite"
          Effect = "Allow"
          Action = [
            "bedrock-agentcore:WriteMemory",
            "bedrock-agentcore:UpdateMemory",
            "bedrock-agentcore:DeleteMemory"
          ]
          Resource = "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:memory/${var.memory_id}"
        }
      ] : []
    )
  })
}

# ============================================
# IAM Policy - A2A Orchestrator Access
# ============================================
resource "aws_iam_role_policy" "a2a_orchestrator" {
  for_each = { for k, v in var.agents : k => v if v.is_orchestrator }

  name = "${each.key}-a2a-orchestrator"
  role = aws_iam_role.agent_execution[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "InvokeSpecialistAgents"
        Effect = "Allow"
        Action = [
          "bedrock-agentcore:InvokeAgentRuntime"
        ]
        Resource = [
          for name, agent in var.agents :
          "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent-runtime/${var.name_prefix}-${name}"
          if !agent.is_orchestrator
        ]
      }
    ]
  })
}

# ============================================
# IAM Policy - DynamoDB Access
# ============================================
resource "aws_iam_role_policy" "dynamodb_access" {
  for_each = var.agents

  name = "${each.key}-dynamodb-access"
  role = aws_iam_role.agent_execution[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = var.dynamodb_table_arns
      }
    ]
  })
}

# ============================================
# IAM Policy - S3 Access (for data, not artifacts)
# ============================================
resource "aws_iam_role_policy" "s3_access" {
  for_each = var.agents

  name = "${each.key}-s3-access"
  role = aws_iam_role.agent_execution[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = concat(
          var.s3_bucket_arns,
          [for arn in var.s3_bucket_arns : "${arn}/*"]
        )
      }
    ]
  })
}

# ============================================
# IAM Policy - CloudWatch Logs
# ============================================
resource "aws_iam_role_policy" "logs_access" {
  for_each = var.agents

  name = "${each.key}-logs-access"
  role = aws_iam_role.agent_execution[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = var.log_group_arns
      }
    ]
  })
}

# ============================================
# AgentCore Agent Runtimes (Code Configuration)
# ============================================
resource "aws_bedrockagentcore_agent_runtime" "agents" {
  for_each = var.agents

  agent_runtime_name = "${var.name_prefix}-${each.key}"
  description        = each.value.description
  role_arn           = aws_iam_role.agent_execution[each.key].arn

  # Code configuration - using S3 ZIP files (NOT containers!)
  agent_runtime_artifact {
    code_configuration {
      entry_point = each.value.entry_point
      runtime     = var.python_runtime

      code {
        s3 {
          bucket = var.artifacts_bucket_name
          prefix = "agents/${each.key}/agent.zip"
        }
      }
    }
  }

  # Network configuration (use PUBLIC for demo)
  network_configuration {
    network_mode = "PUBLIC"
  }

  # Protocol configuration - use HTTP for standard agents
  protocol_configuration {
    server_protocol = "HTTP"
  }

  # Environment variables for A2A discovery
  environment_variables = merge(
    {
      AGENT_NAME  = each.key
      ENVIRONMENT = var.environment
      MEMORY_ID   = var.memory_id
      GATEWAY_URL = var.gateway_url
      AWS_REGION  = var.aws_region
    },
    # Add specialist agent ARNs for orchestrator
    each.value.is_orchestrator ? {
      for name, agent in var.agents :
      "AGENT_${upper(replace(name, "-", "_"))}_ARN" =>
      "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:agent-runtime/${var.name_prefix}-${name}"
      if !agent.is_orchestrator
    } : {}
  )

  tags = {
    Name         = "${var.name_prefix}-${each.key}"
    Agent        = each.key
    Model        = each.value.model_id
    Orchestrator = each.value.is_orchestrator ? "true" : "false"
    Environment  = var.environment
  }
}

# ============================================
# AgentCore Agent Runtime Endpoints
# ============================================
resource "aws_bedrockagentcore_agent_runtime_endpoint" "agents" {
  for_each = var.agents

  name             = "${var.name_prefix}-${each.key}-endpoint"
  agent_runtime_id = aws_bedrockagentcore_agent_runtime.agents[each.key].agent_runtime_id
  description      = "Endpoint for ${each.key} agent"

  tags = {
    Name        = "${var.name_prefix}-${each.key}-endpoint"
    Agent       = each.key
    Environment = var.environment
  }
}

# ============================================
# Outputs
# ============================================
output "agent_runtime_arns" {
  description = "Map of agent names to AgentCore Runtime ARNs"
  value       = { for k, v in aws_bedrockagentcore_agent_runtime.agents : k => v.agent_runtime_arn }
}

output "agent_runtime_ids" {
  description = "Map of agent names to AgentCore Runtime IDs"
  value       = { for k, v in aws_bedrockagentcore_agent_runtime.agents : k => v.agent_runtime_id }
}

output "agent_endpoint_arns" {
  description = "Map of agent names to AgentCore Runtime Endpoint ARNs"
  value       = { for k, v in aws_bedrockagentcore_agent_runtime_endpoint.agents : k => v.agent_runtime_endpoint_arn }
}

output "agent_execution_role_arns" {
  description = "Map of agent names to IAM execution role ARNs"
  value       = { for k, v in aws_iam_role.agent_execution : k => v.arn }
}

output "orchestrator_arn" {
  description = "ARN of the Observer (orchestrator) agent"
  value       = aws_bedrockagentcore_agent_runtime.agents["observer"].agent_runtime_arn
}

output "orchestrator_endpoint_arn" {
  description = "ARN of the Observer (orchestrator) agent endpoint"
  value       = aws_bedrockagentcore_agent_runtime_endpoint.agents["observer"].agent_runtime_endpoint_arn
}
