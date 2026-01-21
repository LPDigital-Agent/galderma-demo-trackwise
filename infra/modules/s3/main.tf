# ============================================
# Galderma TrackWise AI Autopilot Demo
# S3 Module - Artifacts and CSV Packs
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

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "enable_versioning" {
  description = "Enable versioning on buckets"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable server-side encryption"
  type        = bool
  default     = true
}

# ============================================
# Artifacts Bucket
# ============================================
# Stores agent artifacts, model snapshots, prompt versions
#
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.name_prefix}-artifacts-${var.aws_account_id}"

  tags = {
    Name        = "${var.name_prefix}-artifacts"
    Description = "Agent artifacts, model snapshots, prompt versions"
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================
# CSV Packs Bucket
# ============================================
# Stores generated CSV compliance packs for audit
#
resource "aws_s3_bucket" "csv_packs" {
  bucket = "${var.name_prefix}-csv-packs-${var.aws_account_id}"

  tags = {
    Name        = "${var.name_prefix}-csv-packs"
    Description = "Generated CSV compliance packs for 21 CFR Part 11"
  }
}

resource "aws_s3_bucket_versioning" "csv_packs" {
  bucket = aws_s3_bucket.csv_packs.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "csv_packs" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.csv_packs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "csv_packs" {
  bucket = aws_s3_bucket.csv_packs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule to archive old CSV packs
resource "aws_s3_bucket_lifecycle_configuration" "csv_packs" {
  bucket = aws_s3_bucket.csv_packs.id

  rule {
    id     = "archive-old-packs"
    status = "Enabled"

    filter {
      prefix = "packs/"
    }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # Keep for 7 years (regulatory compliance)
    expiration {
      days = 2555
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# ============================================
# Frontend Bucket (for static hosting)
# ============================================
# Stores React frontend build artifacts
#
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.name_prefix}-frontend-${var.aws_account_id}"

  tags = {
    Name        = "${var.name_prefix}-frontend"
    Description = "React frontend static assets"
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Website configuration for SPA routing
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA fallback
  }
}

# ============================================
# Outputs
# ============================================
output "artifacts_bucket_name" {
  description = "Name of the artifacts S3 bucket"
  value       = aws_s3_bucket.artifacts.id
}

output "artifacts_bucket_arn" {
  description = "ARN of the artifacts S3 bucket"
  value       = aws_s3_bucket.artifacts.arn
}

output "csv_packs_bucket_name" {
  description = "Name of the CSV packs S3 bucket"
  value       = aws_s3_bucket.csv_packs.id
}

output "csv_packs_bucket_arn" {
  description = "ARN of the CSV packs S3 bucket"
  value       = aws_s3_bucket.csv_packs.arn
}

output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_website_endpoint" {
  description = "Website endpoint of the frontend bucket"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "all_bucket_arns" {
  description = "ARNs of all S3 buckets"
  value = [
    aws_s3_bucket.artifacts.arn,
    aws_s3_bucket.csv_packs.arn,
    aws_s3_bucket.frontend.arn
  ]
}
