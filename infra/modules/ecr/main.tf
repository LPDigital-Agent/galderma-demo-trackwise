# ============================================
# Galderma TrackWise AI Autopilot Demo
# ECR Module - Container Registries for Agents
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
  description = "List of agent names for ECR repository creation"
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

variable "image_tag_mutability" {
  description = "Image tag mutability setting"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "max_image_count" {
  description = "Maximum number of images to keep per repository"
  type        = number
  default     = 10
}

# ============================================
# ECR Repositories for Agents
# ============================================
resource "aws_ecr_repository" "agents" {
  for_each = toset(var.agent_names)

  name                 = "${var.name_prefix}/${each.value}"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.name_prefix}-${each.value}"
    Agent       = each.value
    Description = "Container images for ${each.value} agent"
  }
}

# ============================================
# ECR Repository for TrackWise Simulator
# ============================================
resource "aws_ecr_repository" "simulator" {
  name                 = "${var.name_prefix}/simulator"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.name_prefix}-simulator"
    Description = "Container images for TrackWise Simulator"
  }
}

# ============================================
# ECR Repository for UI Bridge
# ============================================
resource "aws_ecr_repository" "ui_bridge" {
  name                 = "${var.name_prefix}/ui-bridge"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.name_prefix}-ui-bridge"
    Description = "Container images for UI Bridge WebSocket server"
  }
}

# ============================================
# Lifecycle Policy - Keep last N images
# ============================================
resource "aws_ecr_lifecycle_policy" "agents" {
  for_each   = aws_ecr_repository.agents
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.max_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "simulator" {
  repository = aws_ecr_repository.simulator.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.max_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "ui_bridge" {
  repository = aws_ecr_repository.ui_bridge.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.max_image_count
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================
# Outputs
# ============================================
output "agent_repository_urls" {
  description = "Map of agent names to ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.agents : k => v.repository_url }
}

output "agent_repository_arns" {
  description = "Map of agent names to ECR repository ARNs"
  value       = { for k, v in aws_ecr_repository.agents : k => v.arn }
}

output "simulator_repository_url" {
  description = "ECR repository URL for TrackWise Simulator"
  value       = aws_ecr_repository.simulator.repository_url
}

output "simulator_repository_arn" {
  description = "ECR repository ARN for TrackWise Simulator"
  value       = aws_ecr_repository.simulator.arn
}

output "ui_bridge_repository_url" {
  description = "ECR repository URL for UI Bridge"
  value       = aws_ecr_repository.ui_bridge.repository_url
}

output "ui_bridge_repository_arn" {
  description = "ECR repository ARN for UI Bridge"
  value       = aws_ecr_repository.ui_bridge.arn
}

output "registry_id" {
  description = "ECR registry ID (AWS account ID)"
  value       = data.aws_caller_identity.current.account_id
}

output "all_repository_arns" {
  description = "ARNs of all ECR repositories"
  value = concat(
    [for v in aws_ecr_repository.agents : v.arn],
    [
      aws_ecr_repository.simulator.arn,
      aws_ecr_repository.ui_bridge.arn
    ]
  )
}
