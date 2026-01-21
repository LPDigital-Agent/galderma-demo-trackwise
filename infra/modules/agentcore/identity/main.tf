# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Identity Module - Workload Tokens
# ============================================
#
# This module creates AgentCore Identity resources for:
#   - Workload identities for each agent
#   - Inter-agent authentication via workload tokens
#
# Uses AWS Provider with full AgentCore Identity support.
# Docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/bedrockagentcore_workload_identity
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

variable "agent_names" {
  description = "List of agent names for workload identity creation"
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

# ============================================
# Local Values
# ============================================
locals {
  # AgentCore names must match ^[a-zA-Z][a-zA-Z0-9_]{0,47}$ - no hyphens allowed
  safe_name_prefix = replace(var.name_prefix, "-", "_")
}

# ============================================
# Workload Identities for Agents
# ============================================
resource "aws_bedrockagentcore_workload_identity" "agents" {
  for_each = toset(var.agent_names)

  # AgentCore names must use underscores, not hyphens
  name = "${local.safe_name_prefix}_${replace(each.value, "-", "_")}_workload"

  # Empty for A2A-only agents (no OAuth callbacks needed)
  allowed_resource_oauth2_return_urls = []
}

# ============================================
# Workload Identity for TrackWise Simulator
# ============================================
resource "aws_bedrockagentcore_workload_identity" "simulator" {
  # AgentCore names must use underscores, not hyphens
  name = "${local.safe_name_prefix}_simulator_workload"

  allowed_resource_oauth2_return_urls = []
}

# ============================================
# Outputs
# ============================================
output "workload_identity_arns" {
  description = "Map of agent names to workload identity ARNs"
  value       = { for k, v in aws_bedrockagentcore_workload_identity.agents : k => v.workload_identity_arn }
}

output "simulator_workload_identity_arn" {
  description = "Workload identity ARN for TrackWise Simulator"
  value       = aws_bedrockagentcore_workload_identity.simulator.workload_identity_arn
}
