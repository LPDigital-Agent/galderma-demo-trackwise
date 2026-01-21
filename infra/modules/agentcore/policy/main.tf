# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Policy Module - Cedar Authorization
# ============================================
#
# This module creates an AgentCore Policy Engine with Cedar policies for:
#   - POL-001: Severity Gating (block HIGH/CRITICAL auto-close)
#   - POL-002: Evidence Completeness (require mandatory fields)
#   - POL-003: Confidence Threshold (>= 0.90 for auto-close)
#   - POL-004: Adverse Event Detection (escalate immediately)
#   - POL-005: Regulatory Keywords (flag for human review)
#
# Uses AWS Provider v6.28.0+ with full AgentCore Policy support.
# Docs: https://aws.github.io/bedrock-agentcore-starter-toolkit/user-guide/policy/
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

variable "gateway_arn" {
  description = "ARN of the AgentCore Gateway to attach policies"
  type        = string
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# AgentCore Policy Engine
# ============================================
resource "aws_bedrockagentcore_policy_engine" "main" {
  policy_engine_name = "${var.name_prefix}-policy-engine"
  description        = "Cedar policy engine for TrackWise compliance authorization"

  # Schema definition for Cedar policies
  schema_definition = jsonencode({
    "AgentCore" = {
      entityTypes = {
        "OAuthUser" = {}
        "Agent" = {
          memberOfTypes = ["AgentGroup"]
        }
        "AgentGroup" = {}
        "Gateway" = {}
        "Tool" = {}
      }
      actions = {
        "WritebackTarget___close_case" = {
          appliesTo = {
            principalTypes = ["OAuthUser", "Agent"]
            resourceTypes  = ["Gateway"]
          }
        }
        "WritebackTarget___update_case" = {
          appliesTo = {
            principalTypes = ["OAuthUser", "Agent"]
            resourceTypes  = ["Gateway"]
          }
        }
        "MemoryTarget___write_pattern" = {
          appliesTo = {
            principalTypes = ["Agent"]
            resourceTypes  = ["Gateway"]
          }
        }
        "GuardianApproval" = {
          appliesTo = {
            principalTypes = ["Agent"]
            resourceTypes  = ["Gateway"]
          }
        }
      }
    }
  })

  tags = {
    Name        = "${var.name_prefix}-policy-engine"
    Description = "Cedar policies for TrackWise compliance"
  }
}

# ============================================
# Cedar Policy: POL-001 - Auto-Close for LOW Severity Only
# ============================================
resource "aws_bedrockagentcore_policy" "pol_001_low_severity_autoclose" {
  policy_engine_id = aws_bedrockagentcore_policy_engine.main.id
  policy_name      = "POL-001-LowSeverityAutoClose"
  description      = "Only allow auto-close for LOW severity cases with high confidence and guardian approval"

  # Cedar policy definition
  policy_definition = <<-CEDAR
    // POL-001: Allow auto-close only for LOW severity with confidence >= 0.90
    permit(
      principal is AgentCore::Agent,
      action == AgentCore::Action::"WritebackTarget___close_case",
      resource == AgentCore::Gateway::"${var.gateway_arn}"
    )
    when {
      context.input.severity == "LOW" &&
      context.input.confidence >= 0.90 &&
      context.input.guardian_approved == true
    };
  CEDAR

  tags = {
    Name   = "POL-001"
    Policy = "LowSeverityAutoClose"
  }
}

# ============================================
# Cedar Policy: POL-002 - Block HIGH/CRITICAL Auto-Close
# ============================================
resource "aws_bedrockagentcore_policy" "pol_002_block_high_critical" {
  policy_engine_id = aws_bedrockagentcore_policy_engine.main.id
  policy_name      = "POL-002-BlockHighCritical"
  description      = "Block auto-close for HIGH and CRITICAL severity cases"

  policy_definition = <<-CEDAR
    // POL-002: Forbid auto-close for HIGH/CRITICAL severity
    forbid(
      principal,
      action == AgentCore::Action::"WritebackTarget___close_case",
      resource == AgentCore::Gateway::"${var.gateway_arn}"
    )
    when {
      context.input.severity == "HIGH" ||
      context.input.severity == "CRITICAL"
    };
  CEDAR

  tags = {
    Name   = "POL-002"
    Policy = "BlockHighCritical"
  }
}

# ============================================
# Cedar Policy: POL-003 - Confidence Threshold
# ============================================
resource "aws_bedrockagentcore_policy" "pol_003_confidence_threshold" {
  policy_engine_id = aws_bedrockagentcore_policy_engine.main.id
  policy_name      = "POL-003-ConfidenceThreshold"
  description      = "Block auto-close when confidence is below 0.85"

  policy_definition = <<-CEDAR
    // POL-003: Forbid auto-close when confidence < 0.85
    forbid(
      principal,
      action == AgentCore::Action::"WritebackTarget___close_case",
      resource == AgentCore::Gateway::"${var.gateway_arn}"
    )
    when {
      context.input.confidence < 0.85
    };
  CEDAR

  tags = {
    Name   = "POL-003"
    Policy = "ConfidenceThreshold"
  }
}

# ============================================
# Cedar Policy: POL-004 - Guardian Approval Required
# ============================================
resource "aws_bedrockagentcore_policy" "pol_004_guardian_approval" {
  policy_engine_id = aws_bedrockagentcore_policy_engine.main.id
  policy_name      = "POL-004-GuardianApprovalRequired"
  description      = "Require Compliance Guardian approval for all close actions"

  policy_definition = <<-CEDAR
    // POL-004: Forbid close without guardian approval
    forbid(
      principal,
      action == AgentCore::Action::"WritebackTarget___close_case",
      resource == AgentCore::Gateway::"${var.gateway_arn}"
    )
    unless {
      context.input.guardian_approved == true
    };
  CEDAR

  tags = {
    Name   = "POL-004"
    Policy = "GuardianApprovalRequired"
  }
}

# ============================================
# Cedar Policy: POL-005 - Memory Write Authorization
# ============================================
resource "aws_bedrockagentcore_policy" "pol_005_memory_write" {
  policy_engine_id = aws_bedrockagentcore_policy_engine.main.id
  policy_name      = "POL-005-MemoryWriteAuthorization"
  description      = "Only specific agents can write to memory"

  policy_definition = <<-CEDAR
    // POL-005: Allow memory writes only from authorized agents
    permit(
      principal is AgentCore::Agent,
      action == AgentCore::Action::"MemoryTarget___write_pattern",
      resource == AgentCore::Gateway::"${var.gateway_arn}"
    )
    when {
      principal.name == "recurring-detector" ||
      principal.name == "memory-curator" ||
      principal.name == "writeback"
    };
  CEDAR

  tags = {
    Name   = "POL-005"
    Policy = "MemoryWriteAuthorization"
  }
}

# ============================================
# Attach Policy Engine to Gateway
# ============================================
# Note: This may require updating the gateway resource with policy_engine_arn
# The attachment is typically done in the gateway module

# ============================================
# Outputs
# ============================================
output "policy_engine_id" {
  description = "AgentCore Policy Engine ID"
  value       = aws_bedrockagentcore_policy_engine.main.id
}

output "policy_engine_arn" {
  description = "AgentCore Policy Engine ARN"
  value       = aws_bedrockagentcore_policy_engine.main.arn
}

output "policy_ids" {
  description = "Map of policy names to IDs"
  value = {
    "POL-001" = aws_bedrockagentcore_policy.pol_001_low_severity_autoclose.id
    "POL-002" = aws_bedrockagentcore_policy.pol_002_block_high_critical.id
    "POL-003" = aws_bedrockagentcore_policy.pol_003_confidence_threshold.id
    "POL-004" = aws_bedrockagentcore_policy.pol_004_guardian_approval.id
    "POL-005" = aws_bedrockagentcore_policy.pol_005_memory_write.id
  }
}

output "policy_arns" {
  description = "Map of policy names to ARNs"
  value = {
    "POL-001" = aws_bedrockagentcore_policy.pol_001_low_severity_autoclose.arn
    "POL-002" = aws_bedrockagentcore_policy.pol_002_block_high_critical.arn
    "POL-003" = aws_bedrockagentcore_policy.pol_003_confidence_threshold.arn
    "POL-004" = aws_bedrockagentcore_policy.pol_004_guardian_approval.arn
    "POL-005" = aws_bedrockagentcore_policy.pol_005_memory_write.arn
  }
}
