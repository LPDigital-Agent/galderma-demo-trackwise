# ============================================
# Galderma TrackWise AI Autopilot Demo
# CloudWatch Module - Observability
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

variable "agent_names" {
  description = "List of agent names for log group creation"
  type        = list(string)
  default = [
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

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

# ============================================
# Agent Log Groups
# ============================================
# One log group per agent for organized observability
#
resource "aws_cloudwatch_log_group" "agents" {
  for_each = toset(var.agent_names)

  name              = "/aws/agentcore/${var.name_prefix}/${each.value}"
  retention_in_days = var.log_retention_days

  tags = {
    Name  = "${var.name_prefix}-${each.value}-logs"
    Agent = each.value
  }
}

# ============================================
# AgentCore Vended Logs
# ============================================
# Aggregated logs from AgentCore Runtime
#
resource "aws_cloudwatch_log_group" "agentcore_vended" {
  name              = "/aws/agentcore/${var.name_prefix}/vended-logs"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.name_prefix}-agentcore-vended"
  }
}

# ============================================
# TrackWise Simulator Logs
# ============================================
resource "aws_cloudwatch_log_group" "simulator" {
  name              = "/aws/agentcore/${var.name_prefix}/simulator"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.name_prefix}-simulator-logs"
  }
}

# ============================================
# UI Bridge Logs
# ============================================
resource "aws_cloudwatch_log_group" "ui_bridge" {
  name              = "/aws/agentcore/${var.name_prefix}/ui-bridge"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.name_prefix}-ui-bridge-logs"
  }
}

# ============================================
# CloudWatch Dashboard
# ============================================
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = concat(
      # Agent Invocation Count (row 1)
      [
        {
          type   = "metric"
          x      = 0
          y      = 0
          width  = 12
          height = 6
          properties = {
            title  = "Agent Invocations per minute"
            region = data.aws_region.current.id
            metrics = [
              for agent in var.agent_names : [
                "AgentCore",
                "InvocationCount",
                "AgentName", agent,
                { stat = "Sum", period = 60 }
              ]
            ]
            view   = "timeSeries"
            stacked = false
          }
        }
      ],
      # Agent Latency (row 1)
      [
        {
          type   = "metric"
          x      = 12
          y      = 0
          width  = 12
          height = 6
          properties = {
            title  = "Agent Latency (P50/P99)"
            region = data.aws_region.current.id
            metrics = [
              ["AgentCore", "Latency", "AgentName", "compliance-guardian", { stat = "p50", period = 60 }],
              ["AgentCore", "Latency", "AgentName", "compliance-guardian", { stat = "p99", period = 60 }],
              ["AgentCore", "Latency", "AgentName", "resolution-composer", { stat = "p50", period = 60 }],
              ["AgentCore", "Latency", "AgentName", "resolution-composer", { stat = "p99", period = 60 }]
            ]
            view = "timeSeries"
          }
        }
      ],
      # Error Rate (row 2)
      [
        {
          type   = "metric"
          x      = 0
          y      = 6
          width  = 8
          height = 6
          properties = {
            title  = "Error Rate"
            region = data.aws_region.current.id
            metrics = [
              for agent in var.agent_names : [
                "AgentCore",
                "ErrorCount",
                "AgentName", agent,
                { stat = "Sum", period = 300 }
              ]
            ]
            view = "singleValue"
          }
        }
      ],
      # Tool Call Distribution (row 2)
      [
        {
          type   = "metric"
          x      = 8
          y      = 6
          width  = 8
          height = 6
          properties = {
            title  = "Tool Calls by Type"
            region = data.aws_region.current.id
            metrics = [
              ["AgentCore", "ToolCallCount", "ToolName", "memory_query", { stat = "Sum", period = 300 }],
              ["AgentCore", "ToolCallCount", "ToolName", "memory_write", { stat = "Sum", period = 300 }],
              ["AgentCore", "ToolCallCount", "ToolName", "policy_check", { stat = "Sum", period = 300 }],
              ["AgentCore", "ToolCallCount", "ToolName", "a2a_invoke", { stat = "Sum", period = 300 }]
            ]
            view = "pie"
          }
        }
      ],
      # A2A Communication (row 2)
      [
        {
          type   = "metric"
          x      = 16
          y      = 6
          width  = 8
          height = 6
          properties = {
            title  = "A2A Calls Between Agents"
            region = data.aws_region.current.id
            metrics = [
              ["AgentCore", "A2ACallCount", "SourceAgent", "observer", { stat = "Sum", period = 60 }],
              ["AgentCore", "A2ACallCount", "SourceAgent", "case-understanding", { stat = "Sum", period = 60 }],
              ["AgentCore", "A2ACallCount", "SourceAgent", "recurring-detector", { stat = "Sum", period = 60 }]
            ]
            view = "timeSeries"
          }
        }
      ],
      # Memory Operations (row 3)
      [
        {
          type   = "metric"
          x      = 0
          y      = 12
          width  = 12
          height = 6
          properties = {
            title  = "AgentCore Memory Operations"
            region = data.aws_region.current.id
            metrics = [
              ["AgentCore", "MemoryReadCount", "Strategy", "RecurringPatterns", { stat = "Sum", period = 60 }],
              ["AgentCore", "MemoryReadCount", "Strategy", "ResolutionTemplates", { stat = "Sum", period = 60 }],
              ["AgentCore", "MemoryReadCount", "Strategy", "PolicyKnowledge", { stat = "Sum", period = 60 }],
              ["AgentCore", "MemoryWriteCount", "Strategy", "RecurringPatterns", { stat = "Sum", period = 60 }]
            ]
            view = "timeSeries"
          }
        }
      ],
      # Human-in-the-Loop Events (row 3)
      [
        {
          type   = "metric"
          x      = 12
          y      = 12
          width  = 12
          height = 6
          properties = {
            title  = "Human-in-the-Loop Events"
            region = data.aws_region.current.id
            metrics = [
              ["AgentCore", "HumanReviewRequired", "Reason", "low_confidence", { stat = "Sum", period = 300 }],
              ["AgentCore", "HumanReviewRequired", "Reason", "high_severity", { stat = "Sum", period = 300 }],
              ["AgentCore", "HumanReviewRequired", "Reason", "policy_violation", { stat = "Sum", period = 300 }],
              ["AgentCore", "HumanApproval", "Action", "approved", { stat = "Sum", period = 300 }],
              ["AgentCore", "HumanApproval", "Action", "rejected", { stat = "Sum", period = 300 }]
            ]
            view = "bar"
          }
        }
      ]
    )
  })
}

# ============================================
# CloudWatch Alarms
# ============================================

# High error rate alarm
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "AgentCore"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Agent error rate is above threshold"

  dimensions = {
    Environment = var.environment
  }

  tags = {
    Name = "${var.name_prefix}-high-error-rate-alarm"
  }
}

# High latency alarm (Compliance Guardian)
resource "aws_cloudwatch_metric_alarm" "guardian_high_latency" {
  alarm_name          = "${var.name_prefix}-guardian-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AgentCore"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 30000 # 30 seconds
  alarm_description   = "Compliance Guardian latency is above 30s (p99)"

  dimensions = {
    AgentName = "compliance-guardian"
  }

  tags = {
    Name = "${var.name_prefix}-guardian-latency-alarm"
  }
}

# ============================================
# Data Sources
# ============================================
data "aws_region" "current" {}

# ============================================
# Outputs
# ============================================
output "agent_log_group_names" {
  description = "Map of agent names to log group names"
  value       = { for k, v in aws_cloudwatch_log_group.agents : k => v.name }
}

output "agent_log_group_arns" {
  description = "Map of agent names to log group ARNs"
  value       = { for k, v in aws_cloudwatch_log_group.agents : k => v.arn }
}

output "vended_log_group_name" {
  description = "Name of the AgentCore vended log group"
  value       = aws_cloudwatch_log_group.agentcore_vended.name
}

output "vended_log_group_arn" {
  description = "ARN of the AgentCore vended log group"
  value       = aws_cloudwatch_log_group.agentcore_vended.arn
}

output "simulator_log_group_name" {
  description = "Name of the simulator log group"
  value       = aws_cloudwatch_log_group.simulator.name
}

output "ui_bridge_log_group_name" {
  description = "Name of the UI bridge log group"
  value       = aws_cloudwatch_log_group.ui_bridge.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "all_log_group_arns" {
  description = "ARNs of all log groups"
  value = concat(
    [for v in aws_cloudwatch_log_group.agents : v.arn],
    [
      aws_cloudwatch_log_group.agentcore_vended.arn,
      aws_cloudwatch_log_group.simulator.arn,
      aws_cloudwatch_log_group.ui_bridge.arn
    ]
  )
}
