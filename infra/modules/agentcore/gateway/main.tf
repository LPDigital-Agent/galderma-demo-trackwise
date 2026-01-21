# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Gateway Module - MCP/A2A Routing
# ============================================
#
# This module creates an AgentCore Gateway for:
#   - MCP protocol routing (tools/list, tools/call)
#   - A2A protocol communication between agents
#   - OAuth authorization for external integrations
#
# Uses AWS Provider v6.28.0+ with full AgentCore Gateway support.
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

variable "policy_engine_arn" {
  description = "ARN of the AgentCore Policy Engine for authorization"
  type        = string
  default     = ""
}

variable "policy_mode" {
  description = "Policy enforcement mode: ENFORCE or LOG_ONLY"
  type        = string
  default     = "LOG_ONLY" # Start with LOG_ONLY for demo

  validation {
    condition     = contains(["ENFORCE", "LOG_ONLY"], var.policy_mode)
    error_message = "Policy mode must be ENFORCE or LOG_ONLY."
  }
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# IAM Role for Gateway Execution
# ============================================
resource "aws_iam_role" "gateway_execution" {
  name = "${var.name_prefix}-gateway-execution-role"

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
    Name = "${var.name_prefix}-gateway-execution-role"
  }
}

# ============================================
# AgentCore Gateway Resource
# ============================================
resource "aws_bedrockagentcore_gateway" "main" {
  gateway_name = "${var.name_prefix}-gateway"
  description  = "MCP/A2A Gateway for TrackWise AI Autopilot"

  # Execution role
  role_arn = aws_iam_role.gateway_execution.arn

  # Protocol configuration
  protocol_configuration {
    # Enable MCP protocol for tool access
    mcp_enabled = true

    # Enable A2A protocol for inter-agent communication
    a2a_enabled = true
    a2a_port    = 9000

    # Enable streaming for real-time responses
    streaming_enabled = true
  }

  # Authorization configuration
  authorization_configuration {
    # Use AgentCore Policy Engine if provided
    dynamic "policy_engine" {
      for_each = var.policy_engine_arn != "" ? [1] : []
      content {
        policy_engine_arn = var.policy_engine_arn
        mode              = var.policy_mode
      }
    }

    # OAuth configuration for external integrations (disabled for demo)
    oauth_enabled = false
  }

  # Network configuration
  network_configuration {
    network_mode = "PUBLIC" # Use PUBLIC for demo accessibility
  }

  # Logging configuration
  logging_configuration {
    log_level         = "INFO"
    log_requests      = true
    log_responses     = true
    include_payloads  = var.environment == "dev" # Only in dev
  }

  tags = {
    Name        = "${var.name_prefix}-gateway"
    Description = "MCP/A2A Gateway for agent communication"
  }
}

# ============================================
# Gateway Targets - TrackWise Simulator
# ============================================
# Register the TrackWise Simulator as a gateway target
resource "aws_bedrockagentcore_gateway_target" "simulator" {
  gateway_id  = aws_bedrockagentcore_gateway.main.id
  target_name = "trackwise-simulator"
  description = "TrackWise Digital Simulator API"

  target_configuration {
    target_type = "AGENT_RUNTIME"

    # Reference to the simulator AgentCore Runtime
    agent_runtime_configuration {
      agent_runtime_name = "${var.name_prefix}-simulator"
    }
  }

  # Tool definitions for MCP
  mcp_tools {
    tool_name   = "create_case"
    description = "Create a new TrackWise case"
    input_schema = jsonencode({
      type = "object"
      properties = {
        case_type = {
          type        = "string"
          description = "Type of case: COMPLAINT, INQUIRY"
          enum        = ["COMPLAINT", "INQUIRY"]
        }
        product = {
          type        = "string"
          description = "Galderma product name"
        }
        description = {
          type        = "string"
          description = "Case description"
        }
        severity = {
          type        = "string"
          description = "Severity level"
          enum        = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        }
      }
      required = ["case_type", "product", "description"]
    })
  }

  mcp_tools {
    tool_name   = "update_case"
    description = "Update an existing TrackWise case"
    input_schema = jsonencode({
      type = "object"
      properties = {
        case_id = {
          type        = "string"
          description = "TrackWise case ID"
        }
        status = {
          type        = "string"
          description = "New case status"
          enum        = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
        }
        resolution = {
          type        = "string"
          description = "Resolution text"
        }
      }
      required = ["case_id"]
    })
  }

  mcp_tools {
    tool_name   = "close_case"
    description = "Close a TrackWise case with resolution"
    input_schema = jsonencode({
      type = "object"
      properties = {
        case_id = {
          type        = "string"
          description = "TrackWise case ID to close"
        }
        resolution = {
          type        = "string"
          description = "Final resolution text"
        }
        resolution_code = {
          type        = "string"
          description = "Resolution code"
        }
        languages = {
          type        = "array"
          description = "Languages for resolution"
          items = {
            type = "string"
            enum = ["PT", "EN", "ES", "FR"]
          }
        }
      }
      required = ["case_id", "resolution"]
    })
  }

  mcp_tools {
    tool_name   = "list_cases"
    description = "List TrackWise cases with optional filters"
    input_schema = jsonencode({
      type = "object"
      properties = {
        status = {
          type        = "string"
          description = "Filter by status"
          enum        = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
        }
        severity = {
          type        = "string"
          description = "Filter by severity"
          enum        = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        }
        limit = {
          type        = "integer"
          description = "Maximum number of cases to return"
          default     = 50
        }
      }
    })
  }

  tags = {
    Name = "${var.name_prefix}-simulator-target"
  }
}

# ============================================
# IAM Policy for Gateway Operations
# ============================================
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
        Sid    = "PolicyEngineAccess"
        Effect = "Allow"
        Action = [
          "bedrock-agentcore:EvaluatePolicy"
        ]
        Resource = var.policy_engine_arn != "" ? var.policy_engine_arn : "*"
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
# Outputs
# ============================================
output "gateway_id" {
  description = "AgentCore Gateway ID"
  value       = aws_bedrockagentcore_gateway.main.id
}

output "gateway_arn" {
  description = "AgentCore Gateway ARN"
  value       = aws_bedrockagentcore_gateway.main.arn
}

output "gateway_endpoint" {
  description = "AgentCore Gateway endpoint URL"
  value       = aws_bedrockagentcore_gateway.main.gateway_endpoint
}

output "mcp_endpoint" {
  description = "MCP protocol endpoint"
  value       = "${aws_bedrockagentcore_gateway.main.gateway_endpoint}/mcp"
}

output "a2a_endpoint" {
  description = "A2A protocol endpoint"
  value       = "${aws_bedrockagentcore_gateway.main.gateway_endpoint}:9000"
}

output "gateway_execution_role_arn" {
  description = "IAM role ARN for gateway execution"
  value       = aws_iam_role.gateway_execution.arn
}

output "simulator_target_id" {
  description = "Gateway target ID for TrackWise Simulator"
  value       = aws_bedrockagentcore_gateway_target.simulator.id
}
