# ============================================
# Galderma TrackWise AI Autopilot Demo
# DynamoDB Module - Runs and Ledger Tables
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

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for tables"
  type        = bool
  default     = true
}

variable "deletion_protection_enabled" {
  description = "Enable deletion protection"
  type        = bool
  default     = false # Set to true for production
}

# ============================================
# Runs Table
# ============================================
# Stores agent run history with case association
# Schema:
#   PK: run_id (ULID)
#   SK: N/A (single-table per run)
#   GSI: case_id for querying runs by case
#
resource "aws_dynamodb_table" "runs" {
  name         = "${var.name_prefix}-runs"
  billing_mode = "PAY_PER_REQUEST" # On-demand for demo

  hash_key = "run_id"

  attribute {
    name = "run_id"
    type = "S"
  }

  attribute {
    name = "case_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  # GSI: Query runs by case_id
  global_secondary_index {
    name            = "case_id-created_at-index"
    hash_key        = "case_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Deletion protection
  deletion_protection_enabled = var.deletion_protection_enabled

  # TTL for automatic cleanup (optional, disabled by default)
  ttl {
    attribute_name = "ttl"
    enabled        = false
  }

  tags = {
    Name        = "${var.name_prefix}-runs"
    Description = "Agent run history for TrackWise cases"
  }
}

# ============================================
# Ledger Table (Decision Ledger)
# ============================================
# Stores immutable decision records for audit trail
# Schema:
#   PK: ledger_id (ULID)
#   SK: timestamp (ISO 8601)
#   GSI: run_id for querying decisions by run
#   GSI: agent_name for querying by agent
#
resource "aws_dynamodb_table" "ledger" {
  name         = "${var.name_prefix}-ledger"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "ledger_id"
  range_key = "timestamp"

  attribute {
    name = "ledger_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "run_id"
    type = "S"
  }

  attribute {
    name = "agent_name"
    type = "S"
  }

  # GSI: Query ledger entries by run_id
  global_secondary_index {
    name            = "run_id-timestamp-index"
    hash_key        = "run_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # GSI: Query ledger entries by agent_name
  global_secondary_index {
    name            = "agent_name-timestamp-index"
    hash_key        = "agent_name"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Deletion protection
  deletion_protection_enabled = var.deletion_protection_enabled

  tags = {
    Name        = "${var.name_prefix}-ledger"
    Description = "Immutable decision ledger for audit trail"
  }
}

# ============================================
# Cases Table (TrackWise Simulator Data)
# ============================================
# Stores simulated TrackWise case data
# Schema:
#   PK: case_id (TrackWise case number)
#   GSI: status for filtering by case status
#   GSI: created_at for chronological listing
#
resource "aws_dynamodb_table" "cases" {
  name         = "${var.name_prefix}-cases"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "case_id"

  attribute {
    name = "case_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  attribute {
    name = "severity"
    type = "S"
  }

  # GSI: Query cases by status
  global_secondary_index {
    name            = "status-created_at-index"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # GSI: Query cases by severity
  global_secondary_index {
    name            = "severity-created_at-index"
    hash_key        = "severity"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Deletion protection
  deletion_protection_enabled = var.deletion_protection_enabled

  tags = {
    Name        = "${var.name_prefix}-cases"
    Description = "Simulated TrackWise case data"
  }
}

# ============================================
# Outputs
# ============================================
output "runs_table_name" {
  description = "Name of the runs DynamoDB table"
  value       = aws_dynamodb_table.runs.name
}

output "runs_table_arn" {
  description = "ARN of the runs DynamoDB table"
  value       = aws_dynamodb_table.runs.arn
}

output "ledger_table_name" {
  description = "Name of the ledger DynamoDB table"
  value       = aws_dynamodb_table.ledger.name
}

output "ledger_table_arn" {
  description = "ARN of the ledger DynamoDB table"
  value       = aws_dynamodb_table.ledger.arn
}

output "cases_table_name" {
  description = "Name of the cases DynamoDB table"
  value       = aws_dynamodb_table.cases.name
}

output "cases_table_arn" {
  description = "ARN of the cases DynamoDB table"
  value       = aws_dynamodb_table.cases.arn
}

output "all_table_arns" {
  description = "ARNs of all DynamoDB tables"
  value = [
    aws_dynamodb_table.runs.arn,
    aws_dynamodb_table.ledger.arn,
    aws_dynamodb_table.cases.arn
  ]
}
