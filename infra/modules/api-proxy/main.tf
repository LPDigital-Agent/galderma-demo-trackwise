# ============================================
# Galderma TrackWise AI Autopilot Demo
# API Proxy Module - Lambda Function URL
# ============================================
#
# This module creates a minimal Lambda proxy that:
# 1. Receives HTTP requests from the frontend (unauthenticated)
# 2. Signs them with SigV4 for AWS authentication
# 3. Forwards to the AgentCore Simulator endpoint
#
# This is necessary because:
# - AgentCore Runtime requires IAM authentication
# - Browsers cannot make SigV4 signed requests
# - The frontend needs standard HTTP endpoints
#
# This is a thin translation layer, not business logic.
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

variable "simulator_runtime_id" {
  description = "AgentCore Simulator Runtime ID"
  type        = string
}

# ============================================
# Data Sources
# ============================================
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================
# IAM Role for Lambda
# ============================================
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api_proxy" {
  name               = "${var.name_prefix}-api-proxy-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.name_prefix}-api-proxy-role"
    Environment = var.environment
  }
}

# ============================================
# IAM Policy - AgentCore Invoke
# ============================================
resource "aws_iam_role_policy" "agentcore_invoke" {
  name = "agentcore-invoke"
  role = aws_iam_role.api_proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "InvokeSimulator"
        Effect = "Allow"
        Action = [
          "bedrock-agentcore:InvokeAgentRuntime",
          "bedrock-agentcore-runtime:InvokeAgentRuntime"
        ]
        Resource = [
          "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:runtime/${var.simulator_runtime_id}",
          "arn:aws:bedrock-agentcore:${var.aws_region}:${data.aws_caller_identity.current.account_id}:runtime/${var.simulator_runtime_id}/*"
        ]
      }
    ]
  })
}

# ============================================
# IAM Policy - CloudWatch Logs
# ============================================
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.api_proxy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ============================================
# Lambda Function - API Proxy
# ============================================
data "archive_file" "api_proxy" {
  type        = "zip"
  output_path = "${path.module}/api_proxy.zip"

  source {
    content  = <<-PYTHON
import json
import os
import re
import boto3

# Get region from environment (Lambda sets AWS_REGION automatically)
REGION = os.environ.get('AGENTCORE_REGION', os.environ.get('AWS_REGION', 'us-east-2'))
ACCOUNT_ID = os.environ.get('AGENTCORE_ACCOUNT_ID', '176545286005')
SIMULATOR_RUNTIME_ID = os.environ['SIMULATOR_RUNTIME_ID']

# Initialize AgentCore client (bedrock-agentcore, NOT bedrock-agentcore-runtime)
agentcore_client = boto3.client('bedrock-agentcore', region_name=REGION)

# Build the full ARN for the simulator
SIMULATOR_RUNTIME_ARN = f"arn:aws:bedrock-agentcore:{REGION}:{ACCOUNT_ID}:runtime/{SIMULATOR_RUNTIME_ID}"

# CORS headers for all responses
CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
}

def parse_query_string(query_string):
    """Parse query string into dict."""
    if not query_string:
        return {}
    params = {}
    for pair in query_string.split('&'):
        if '=' in pair:
            key, value = pair.split('=', 1)
            params[key] = value
    return params

def route_to_action(method, path, query_params, body):
    """Map HTTP REST requests to AgentCore action-based invocations."""

    # Parse body if JSON
    if body and isinstance(body, str):
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            body = {}
    elif not body:
        body = {}

    # Case endpoints
    case_id_match = re.match(r'^/api/cases/([^/]+)(/close)?$', path)

    if path == '/api/cases':
        if method == 'GET':
            return {
                'action': 'list_cases',
                'status': query_params.get('status'),
                'severity': query_params.get('severity'),
                'case_type': query_params.get('case_type'),
                'page': int(query_params.get('page', 1)),
                'page_size': int(query_params.get('page_size', 20))
            }
        elif method == 'POST':
            return {
                'action': 'create_case',
                'case': body
            }

    elif case_id_match:
        case_id = case_id_match.group(1)
        is_close = case_id_match.group(2) == '/close'

        if is_close and method == 'POST':
            return {
                'action': 'close_case',
                'case_id': case_id,
                'resolution_text': query_params.get('resolution_text', ''),
                'resolution_text_pt': query_params.get('resolution_text_pt'),
                'resolution_text_en': query_params.get('resolution_text_en'),
                'resolution_text_es': query_params.get('resolution_text_es'),
                'resolution_text_fr': query_params.get('resolution_text_fr'),
                'processed_by_agent': query_params.get('processed_by_agent')
            }
        elif method == 'GET':
            return {
                'action': 'get_case',
                'case_id': case_id
            }
        elif method == 'PATCH':
            return {
                'action': 'update_case',
                'case_id': case_id,
                'update': body
            }
        elif method == 'DELETE':
            return {
                'action': 'delete_case',
                'case_id': case_id
            }

    # Events endpoint
    elif path == '/api/events':
        return {
            'action': 'list_events',
            'limit': int(query_params.get('limit', 100)),
            'event_type': query_params.get('event_type')
        }

    # Batch endpoint
    elif path == '/api/batch' and method == 'POST':
        return {
            'action': 'create_batch',
            'batch': body
        }

    # Stats endpoints
    elif path == '/api/stats/executive':
        return {
            'action': 'get_executive_stats'
        }
    elif path == '/api/stats':
        return {
            'action': 'get_stats'
        }

    # Runs endpoints
    elif re.match(r'^/api/runs/([^/]+)$', path):
        run_id = re.match(r'^/api/runs/([^/]+)$', path).group(1)
        return {
            'action': 'get_run',
            'run_id': run_id
        }
    elif path == '/api/runs':
        return {
            'action': 'list_runs',
            'case_id': query_params.get('case_id'),
            'status': query_params.get('status')
        }

    # Ledger endpoint
    elif path == '/api/ledger':
        return {
            'action': 'list_ledger',
            'case_id': query_params.get('case_id'),
            'run_id': query_params.get('run_id'),
            'agent_name': query_params.get('agent_name'),
            'limit': int(query_params.get('limit', 100))
        }

    # Memory endpoint
    elif path == '/api/memory':
        return {
            'action': 'get_memory'
        }

    # CSV Pack endpoint
    elif path == '/api/csv-pack' and method == 'POST':
        return {
            'action': 'generate_csv_pack'
        }

    # Scenario endpoint
    elif path == '/api/scenario/galderma' and method == 'POST':
        return {
            'action': 'create_galderma_scenario'
        }

    # Reset endpoint
    elif path == '/api/reset' and method == 'POST':
        return {
            'action': 'reset_demo'
        }

    # SAC Module endpoints
    elif path == '/api/sac/generate' and method == 'POST':
        return {
            'action': 'sac_generate',
            'request': body
        }
    elif path == '/api/sac/status':
        return {
            'action': 'sac_get_status'
        }
    elif path == '/api/sac/scenarios':
        return {
            'action': 'sac_get_scenarios'
        }
    elif path == '/api/sac/configure' and method == 'POST':
        return {
            'action': 'sac_configure',
            'request': body
        }

    # Ping (health check)
    elif path == '/ping' or path == '/api/ping':
        return {
            'action': 'ping'
        }

    return None

def format_response(action, result):
    """Format AgentCore response to HTTP response."""
    if not result.get('success', True):
        return 400, result

    # Extract the actual data from result
    if action == 'list_cases':
        return 200, result.get('result', result)
    elif action == 'get_case':
        return 200, result.get('case', result)
    elif action == 'create_case':
        return 201, result.get('case', result)
    elif action == 'update_case':
        return 200, result.get('case', result)
    elif action == 'close_case':
        return 200, result.get('case', result)
    elif action == 'create_batch':
        return 201, result.get('result', result)
    elif action == 'get_stats':
        return 200, result.get('stats', result)
    elif action == 'get_executive_stats':
        return 200, result.get('stats', result)
    elif action in ('list_runs', 'get_run'):
        return 200, result.get('result', result)
    elif action == 'list_ledger':
        return 200, result.get('result', result)
    elif action == 'get_memory':
        return 200, result.get('result', result)
    elif action == 'generate_csv_pack':
        return 200, result.get('result', result)
    elif action == 'create_galderma_scenario':
        return 200, result.get('result', result)
    elif action == 'reset_demo':
        return 200, result.get('result', result)
    elif action in ('sac_generate', 'sac_get_status', 'sac_get_scenarios', 'sac_configure'):
        return 200, result.get('result', result)
    elif action == 'ping':
        return 200, {'status': 'healthy', 'service': 'simulator'}

    return 200, result

def lambda_handler(event, context):
    """
    Proxy HTTP requests to AgentCore Simulator.

    This Lambda translates REST API calls to AgentCore action-based invocations:
    - GET /api/cases -> action: list_cases
    - POST /api/cases -> action: create_case
    - GET /api/cases/{id} -> action: get_case
    - PATCH /api/cases/{id} -> action: update_case
    - POST /api/cases/{id}/close -> action: close_case
    - GET /api/events -> action: list_events
    - POST /api/batch -> action: create_batch
    - GET /api/stats -> action: get_stats
    - GET /api/stats/executive -> action: get_executive_stats
    - GET /api/runs -> action: list_runs
    - GET /api/runs/{id} -> action: get_run
    - GET /api/ledger -> action: list_ledger
    - GET /api/memory -> action: get_memory
    - POST /api/csv-pack -> action: generate_csv_pack
    - POST /api/scenario/galderma -> action: create_galderma_scenario
    - POST /api/reset -> action: reset_demo
    """
    try:
        # Handle OPTIONS (CORS preflight)
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': ''
            }

        # Extract request details
        path = event.get('rawPath', '/')
        query_string = event.get('rawQueryString', '')
        body = event.get('body', '')

        # Decode body if base64 encoded
        if event.get('isBase64Encoded', False) and body:
            import base64
            body = base64.b64decode(body).decode('utf-8')

        # Parse query string
        query_params = parse_query_string(query_string)

        print(f"Request: {http_method} {path} query={query_params}")

        # Route to action
        payload = route_to_action(http_method, path, query_params, body)

        if payload is None:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': f'Unknown endpoint: {http_method} {path}'})
            }

        action = payload.get('action')
        print(f"Mapped to action: {action}")

        # Invoke AgentCore Simulator
        response = agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=SIMULATOR_RUNTIME_ARN,
            payload=json.dumps(payload).encode('utf-8'),
            contentType='application/json',
            accept='application/json'
        )

        # Parse response - AgentCore returns a streaming body in 'response' key
        # The response is iterable and returns chunks that need to be joined
        streaming_body = response.get('response')
        if streaming_body is not None:
            # Handle streaming response - iterate through chunks
            content_chunks = []
            if hasattr(streaming_body, '__iter__'):
                for chunk in streaming_body:
                    if isinstance(chunk, bytes):
                        content_chunks.append(chunk.decode('utf-8'))
                    else:
                        content_chunks.append(str(chunk))
            elif hasattr(streaming_body, 'read'):
                # Fallback for StreamingBody with read() method
                content_chunks.append(streaming_body.read().decode('utf-8'))
            output_text = ''.join(content_chunks)
        else:
            # Fallback to payload key for compatibility
            response_payload = response.get('payload', b'{}')
            if hasattr(response_payload, 'read'):
                output_text = response_payload.read().decode('utf-8')
            else:
                output_text = response_payload.decode('utf-8') if isinstance(response_payload, bytes) else str(response_payload)

        print(f"AgentCore response: {output_text[:500] if output_text else 'EMPTY'}...")

        try:
            result = json.loads(output_text)
        except json.JSONDecodeError:
            result = {'success': True, 'response': output_text}

        # Format response
        status_code, response_body = format_response(action, result)

        return {
            'statusCode': status_code,
            'headers': CORS_HEADERS,
            'body': json.dumps(response_body)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
PYTHON
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "api_proxy" {
  function_name    = "${var.name_prefix}-api-proxy"
  filename         = data.archive_file.api_proxy.output_path
  source_code_hash = data.archive_file.api_proxy.output_base64sha256
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  role             = aws_iam_role.api_proxy.arn
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SIMULATOR_RUNTIME_ID = var.simulator_runtime_id
      AGENTCORE_REGION     = var.aws_region
      AGENTCORE_ACCOUNT_ID = data.aws_caller_identity.current.account_id
    }
  }

  tags = {
    Name        = "${var.name_prefix}-api-proxy"
    Environment = var.environment
    Purpose     = "HTTP to AgentCore translation layer"
  }
}

# ============================================
# Lambda Function URL (public access)
# ============================================
resource "aws_lambda_function_url" "api_proxy" {
  function_name      = aws_lambda_function.api_proxy.function_name
  authorization_type = "NONE" # Public access for demo

  # CORS handled exclusively by Lambda function code (CORS_HEADERS dict)
  # to avoid duplicate Access-Control-Allow-Origin headers (*, * is invalid)
}

# ============================================
# Outputs
# ============================================
output "function_arn" {
  description = "ARN of the API Proxy Lambda function"
  value       = aws_lambda_function.api_proxy.arn
}

output "function_url" {
  description = "URL of the Lambda Function (API endpoint)"
  value       = aws_lambda_function_url.api_proxy.function_url
}

output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api_proxy.function_name
}
