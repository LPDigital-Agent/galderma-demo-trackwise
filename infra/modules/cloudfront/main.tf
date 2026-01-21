# ============================================
# Galderma TrackWise AI Autopilot Demo
# CloudFront Module - Frontend CDN Distribution
# ============================================
#
# This module creates a CloudFront distribution for the React frontend.
# Uses Origin Access Control (OAC) for secure S3 access.
#
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

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend assets"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "S3 bucket ARN for frontend assets"
  type        = string
}

variable "frontend_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe only (cheapest)
}

variable "default_ttl" {
  description = "Default TTL for cached objects (seconds)"
  type        = number
  default     = 86400 # 1 day
}

variable "max_ttl" {
  description = "Maximum TTL for cached objects (seconds)"
  type        = number
  default     = 604800 # 7 days
}

# ============================================
# Origin Access Control (OAC)
# ============================================
# Modern replacement for Origin Access Identity (OAI)
# Provides secure, signed requests from CloudFront to S3
#
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.name_prefix}-frontend-oac"
  description                       = "OAC for ${var.name_prefix} frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ============================================
# S3 Bucket Policy for CloudFront Access
# ============================================
# Allows only CloudFront to read from the S3 bucket
#
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "frontend_cloudfront" {
  bucket = var.frontend_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.frontend_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
}

# ============================================
# CloudFront Distribution
# ============================================
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.name_prefix} Frontend Distribution"
  default_root_object = "index.html"
  price_class         = var.price_class
  wait_for_deployment = true

  # ─────────────────────────────────────────
  # Origin: S3 Bucket
  # ─────────────────────────────────────────
  origin {
    domain_name              = var.frontend_bucket_regional_domain_name
    origin_id                = "S3-${var.frontend_bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # ─────────────────────────────────────────
  # Default Cache Behavior
  # ─────────────────────────────────────────
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.frontend_bucket_name}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Managed cache policy: CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    # Managed origin request policy: CORS-S3Origin
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
  }

  # ─────────────────────────────────────────
  # Custom Error Responses for SPA
  # ─────────────────────────────────────────
  # React Router needs 404 and 403 errors to return index.html
  # This enables client-side routing for paths like /cases, /network, etc.
  #
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # ─────────────────────────────────────────
  # Geo Restrictions (none for demo)
  # ─────────────────────────────────────────
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # ─────────────────────────────────────────
  # SSL/TLS Configuration
  # ─────────────────────────────────────────
  # Using default CloudFront certificate (*.cloudfront.net)
  # For production, use ACM certificate with custom domain
  #
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.name_prefix}-frontend-distribution"
  }
}

# ============================================
# Outputs
# ============================================
output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_url" {
  description = "Full HTTPS URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "origin_access_control_id" {
  description = "Origin Access Control ID"
  value       = aws_cloudfront_origin_access_control.frontend.id
}
