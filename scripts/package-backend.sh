#!/usr/bin/env bash
# ============================================
# Galderma TrackWise AI Autopilot Demo
# Backend Packaging Script for AgentCore Runtime
# ============================================
#
# This script packages the backend (TrackWise Simulator)
# with ARM64-compatible dependencies for AgentCore Runtime.
#
# IMPORTANT: AgentCore uses ARM64 (Graviton) - binaries must be aarch64!
#
# Usage: ./scripts/package-backend.sh
# ============================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
BUILD_DIR="$PROJECT_ROOT/.build/backend"
S3_BUCKET="galderma-trackwise-dev-artifacts-176545286005"
AWS_REGION="us-east-2"
AWS_PROFILE="${AWS_PROFILE:-fabio-dev-lpd}"
PYTHON_VERSION="python3.12"

echo "=========================================="
echo "Galderma TrackWise Backend Packaging"
echo "=========================================="
echo "Project root: $PROJECT_ROOT"
echo "S3 bucket: $S3_BUCKET"
echo "AWS profile: $AWS_PROFILE"
echo "Python: $PYTHON_VERSION"
echo ""

# Check Python version
if ! command -v $PYTHON_VERSION &> /dev/null; then
    echo "ERROR: $PYTHON_VERSION not found. Please install Python 3.12+"
    exit 1
fi

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "----------------------------------------"
echo "Packaging Backend (TrackWise Simulator)"
echo "----------------------------------------"

# Copy backend source code
cp -r "$BACKEND_DIR/src" "$BUILD_DIR/"
echo "✓ Copied backend source code"

# Create main.py entry point for AgentCore
cat > "$BUILD_DIR/main.py" << 'MAIN_EOF'
#!/usr/bin/env python3
"""
AgentCore Runtime Entry Point for TrackWise Simulator.

This wrapper loads the FastAPI app and handles AgentCore invocations.
IMPORTANT: Uses lazy imports to avoid cold start timeout.
"""
import json
import logging
import os

# Configure logging FIRST (lightweight)
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "simulator", "message": "%(message)s"}',
)
logger = logging.getLogger("simulator")

# Import BedrockAgentCoreApp (lightweight)
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# Initialize BedrockAgentCoreApp BEFORE heavy imports
agentcore_app = BedrockAgentCoreApp()

# Lazy-loaded module reference
_invocations_handler = None


def get_invocations_handler():
    """Lazy-load the invocations handler to avoid cold start timeout."""
    global _invocations_handler
    if _invocations_handler is None:
        logger.info("Lazy-loading simulator modules...")
        from src.main import invocations
        _invocations_handler = invocations
        logger.info("Simulator modules loaded successfully")
    return _invocations_handler


@agentcore_app.entrypoint
def handler(event: dict) -> dict:
    """AgentCore Runtime handler for simulator."""
    logger.info(f"Received event: {str(event)[:500]}")

    import asyncio

    try:
        # Lazy-load the invocations handler
        invoke_handler = get_invocations_handler()

        # Run the async handler synchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(invoke_handler(event))
            return result
        finally:
            loop.close()
    except Exception as e:
        logger.error(f"Handler error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    logger.info("Starting TrackWise Simulator on AgentCore Runtime")
    agentcore_app.run()
MAIN_EOF
echo "✓ Created main.py entry point"

# Create requirements.txt
cat > "$BUILD_DIR/requirements.txt" << 'EOF'
# AWS Bedrock AgentCore SDK (REQUIRED for deployment)
bedrock-agentcore>=0.1.0

# Strands Agents (for A2A communication)
strands-agents>=0.1.0

# FastAPI (for REST endpoints and /invocations)
fastapi>=0.110.0
uvicorn>=0.27.0

# Pydantic v2 (data validation)
pydantic>=2.6.0
pydantic-settings>=2.2.0

# HTTP client (for A2A calls to agents)
httpx>=0.27.0

# WebSocket support
websockets>=12.0

# AWS SDK
boto3>=1.34.0

# Async support
anyio>=4.3.0

# Date/time handling
python-dateutil>=2.9.0

# ULID for unique identifiers
python-ulid>=2.0.0
EOF
echo "✓ Created requirements.txt"

# Install dependencies (ARM64 only)
echo "Installing dependencies (ARM64 only)..."
venv_dir="$BUILD_DIR/.venv_backend"
rm -rf "$venv_dir"
$PYTHON_VERSION -m venv "$venv_dir"

source "$venv_dir/bin/activate"
pip install --upgrade pip wheel > /dev/null

# Install dependencies for ARM64 Linux (Graviton)
pip install \
    --target "$BUILD_DIR" \
    --platform manylinux2014_aarch64 \
    --python-version 3.12 \
    --implementation cp \
    --only-binary=:all: \
    -r "$BUILD_DIR/requirements.txt"

deactivate
rm -rf "$venv_dir"

# CRITICAL: Remove any x86_64 binaries
echo "Cleaning x86_64 binaries (if any)..."
find "$BUILD_DIR" -name "*x86_64*" -type f -delete 2>/dev/null || true
find "$BUILD_DIR" -name "*x86-64*" -type f -delete 2>/dev/null || true

# Remove unnecessary files to reduce ZIP size
# IMPORTANT: Keep dist-info directories (required by importlib.metadata)
find "$BUILD_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$BUILD_DIR" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find "$BUILD_DIR" -name "*.pyc" -delete 2>/dev/null || true
find "$BUILD_DIR" -name "*.pyo" -delete 2>/dev/null || true

echo "✓ Dependencies installed (ARM64 only)"

# Create ZIP file
zip_file="$BUILD_DIR/simulator.zip"
cd "$BUILD_DIR"
# IMPORTANT: Keep *.dist-info directories! Required by importlib.metadata
zip -rq "$zip_file" . -x "*.pyc" -x "__pycache__/*" -x ".DS_Store" -x ".venv_backend/*" -x "simulator.zip"
cd "$PROJECT_ROOT"

# Get ZIP size
zip_size=$(ls -lh "$zip_file" | awk '{print $5}')
echo "✓ Created ZIP: $zip_file"
echo "  ZIP size: $zip_size"

# Upload to S3
echo "Uploading to S3..."
AWS_PROFILE="$AWS_PROFILE" aws s3 cp "$zip_file" \
    "s3://$S3_BUCKET/backend/simulator.zip" \
    --region "$AWS_REGION" > /dev/null
echo "✓ Uploaded to s3://$S3_BUCKET/backend/simulator.zip"

echo ""
echo "=========================================="
echo "Backend packaging complete!"
echo "=========================================="
echo ""
echo "Verify upload:"
echo "  AWS_PROFILE=$AWS_PROFILE aws s3 ls s3://$S3_BUCKET/backend/ --region $AWS_REGION"
echo ""
