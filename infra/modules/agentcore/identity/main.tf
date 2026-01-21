# ============================================
# Galderma TrackWise AI Autopilot Demo
# AgentCore Identity Module - Workload Tokens
# ============================================
#
# This module creates AgentCore Identity resources for:
#   - Workload identities for each agent
#   - Inter-agent authentication via workload tokens
#   - OAuth2 credential provider for TrackWise API (mock)
#
# Uses AWS Provider v6.28.0+ with full AgentCore Identity support.
# Docs: https://aws.github.io/bedrock-agentcore-starter-toolkit/api-reference/identity.md
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
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}

# ============================================
# Workload Identities for Agents
# ============================================
# Each agent gets its own workload identity for A2A authentication
#
resource "aws_bedrockagentcore_workload_identity" "agents" {
  for_each = toset(var.agent_names)

  workload_identity_name = "${var.name_prefix}-${each.value}-workload"
  description            = "Workload identity for ${each.value} agent"

  # Configuration for workload token generation
  token_configuration {
    # Token validity duration (in seconds)
    token_ttl = 3600 # 1 hour

    # Allowed audiences for token verification
    allowed_audiences = [
      "bedrock-agentcore",
      "${var.name_prefix}-agents"
    ]
  }

  # OAuth2 return URLs (empty for A2A-only agents)
  allowed_resource_oauth2_return_urls = []

  tags = {
    Name  = "${var.name_prefix}-${each.value}-workload"
    Agent = each.value
  }
}

# ============================================
# Workload Identity for TrackWise Simulator
# ============================================
resource "aws_bedrockagentcore_workload_identity" "simulator" {
  workload_identity_name = "${var.name_prefix}-simulator-workload"
  description            = "Workload identity for TrackWise Simulator"

  token_configuration {
    token_ttl = 3600

    allowed_audiences = [
      "bedrock-agentcore",
      "${var.name_prefix}-simulator"
    ]
  }

  allowed_resource_oauth2_return_urls = []

  tags = {
    Name = "${var.name_prefix}-simulator-workload"
  }
}

# ============================================
# OAuth2 Credential Provider (Mock TrackWise API)
# ============================================
# This creates a credential provider for the mock TrackWise API
# In production, this would integrate with actual TrackWise OAuth2
#
resource "aws_bedrockagentcore_oauth2_credential_provider" "trackwise_api" {
  provider_name = "${var.name_prefix}-trackwise-api"
  description   = "OAuth2 credential provider for TrackWise API (mock)"

  # OAuth2 configuration
  oauth2_configuration {
    # Grant type for machine-to-machine (M2M) authentication
    grant_type = "CLIENT_CREDENTIALS"

    # Token endpoint (mock - points to simulator in demo)
    token_endpoint_url = "https://${var.name_prefix}.demo.local/oauth/token"

    # Scopes available for this provider
    available_scopes = [
      "cases:read",
      "cases:write",
      "cases:close"
    ]

    # Client credentials (stored in Secrets Manager)
    client_id_secret_arn     = aws_secretsmanager_secret.trackwise_oauth_client_id.arn
    client_secret_secret_arn = aws_secretsmanager_secret.trackwise_oauth_client_secret.arn
  }

  tags = {
    Name = "${var.name_prefix}-trackwise-api-provider"
  }
}

# ============================================
# Secrets Manager - OAuth Client Credentials
# ============================================
# Store mock OAuth credentials in Secrets Manager
#
resource "aws_secretsmanager_secret" "trackwise_oauth_client_id" {
  name        = "${var.name_prefix}/oauth/trackwise-api/client-id"
  description = "OAuth2 client ID for TrackWise API (mock)"

  tags = {
    Name = "${var.name_prefix}-trackwise-oauth-client-id"
  }
}

resource "aws_secretsmanager_secret_version" "trackwise_oauth_client_id" {
  secret_id     = aws_secretsmanager_secret.trackwise_oauth_client_id.id
  secret_string = "demo-trackwise-client-id" # Mock value for demo
}

resource "aws_secretsmanager_secret" "trackwise_oauth_client_secret" {
  name        = "${var.name_prefix}/oauth/trackwise-api/client-secret"
  description = "OAuth2 client secret for TrackWise API (mock)"

  tags = {
    Name = "${var.name_prefix}-trackwise-oauth-client-secret"
  }
}

resource "aws_secretsmanager_secret_version" "trackwise_oauth_client_secret" {
  secret_id     = aws_secretsmanager_secret.trackwise_oauth_client_secret.id
  secret_string = "demo-trackwise-client-secret-${random_password.oauth_secret.result}"
}

resource "random_password" "oauth_secret" {
  length  = 32
  special = false
}

# ============================================
# IAM Policy - Secrets Manager Access
# ============================================
# Allow AgentCore to access OAuth secrets
#
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.name_prefix}-identity-secrets-access"
  description = "Allow access to OAuth credential secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.trackwise_oauth_client_id.arn,
          aws_secretsmanager_secret.trackwise_oauth_client_secret.arn
        ]
      }
    ]
  })
}

# ============================================
# Outputs
# ============================================
output "workload_identity_names" {
  description = "Map of agent names to workload identity names"
  value       = { for k, v in aws_bedrockagentcore_workload_identity.agents : k => v.workload_identity_name }
}

output "workload_identity_arns" {
  description = "Map of agent names to workload identity ARNs"
  value       = { for k, v in aws_bedrockagentcore_workload_identity.agents : k => v.arn }
}

output "simulator_workload_identity_name" {
  description = "Workload identity name for TrackWise Simulator"
  value       = aws_bedrockagentcore_workload_identity.simulator.workload_identity_name
}

output "simulator_workload_identity_arn" {
  description = "Workload identity ARN for TrackWise Simulator"
  value       = aws_bedrockagentcore_workload_identity.simulator.arn
}

output "oauth_provider_name" {
  description = "OAuth2 credential provider name"
  value       = aws_bedrockagentcore_oauth2_credential_provider.trackwise_api.provider_name
}

output "oauth_provider_arn" {
  description = "OAuth2 credential provider ARN"
  value       = aws_bedrockagentcore_oauth2_credential_provider.trackwise_api.arn
}

output "secrets_access_policy_arn" {
  description = "IAM policy ARN for secrets access"
  value       = aws_iam_policy.secrets_access.arn
}
