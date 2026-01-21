#!/usr/bin/env bash
# ============================================
# Galderma TrackWise AI Autopilot Demo
# Agent Packaging Script for AgentCore Runtime
# ============================================
#
# This script packages each agent WITH PRE-INSTALLED DEPENDENCIES
# and uploads to S3 for AgentCore code deployment.
#
# IMPORTANT: Dependencies are bundled in the ZIP to avoid cold start timeouts!
# This is the "Lambda layer" approach for AgentCore code deployment.
#
# Usage: ./scripts/package-agents.sh [agent-name]
#        If agent-name is provided, only that agent is packaged
#        Otherwise, all agents are packaged
# ============================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENTS_DIR="$PROJECT_ROOT/agents"
BUILD_DIR="$PROJECT_ROOT/.build/agents"
S3_BUCKET="galderma-trackwise-dev-artifacts-176545286005"
AWS_REGION="us-east-2"
AWS_PROFILE="${AWS_PROFILE:-fabio-dev-lpd}"
PYTHON_VERSION="python3.12"

# Agent list (Terraform name : directory name)
AGENTS="observer:observer
case-understanding:case_understanding
recurring-detector:recurring_detector
compliance-guardian:compliance_guardian
resolution-composer:resolution_composer
inquiry-bridge:inquiry_bridge
writeback:writeback
memory-curator:memory_curator
csv-pack:csv_pack"

echo "=========================================="
echo "Galderma TrackWise Agent Packaging"
echo "=========================================="
echo "Project root: $PROJECT_ROOT"
echo "S3 bucket: $S3_BUCKET"
echo "AWS profile: $AWS_PROFILE"
echo "Python: $PYTHON_VERSION"
echo ""

# Create build directory
mkdir -p "$BUILD_DIR"

# Check Python version
if ! command -v $PYTHON_VERSION &> /dev/null; then
    echo "ERROR: $PYTHON_VERSION not found. Please install Python 3.12+"
    exit 1
fi

# Function to get directory name for an agent
get_agent_dir() {
    local tf_name=$1
    echo "$AGENTS" | grep "^$tf_name:" | cut -d: -f2
}

# Minimal requirements for fast cold start
# These are the CORE dependencies needed for agents to run
# Heavy dependencies like boto3 are already in AgentCore runtime
create_minimal_requirements() {
    local agent_tf_name=$1

    cat > "$BUILD_DIR/$agent_tf_name/requirements.txt" << 'EOF'
# Core Strands SDK (lightweight)
strands-agents>=0.1.0

# AWS Bedrock AgentCore SDK (REQUIRED for BedrockAgentCoreApp)
bedrock-agentcore>=0.1.0

# Pydantic for structured data
pydantic>=2.6.0
pydantic-settings>=2.2.0

# Async support (lightweight)
anyio>=4.3.0

# Utilities (lightweight)
python-dateutil>=2.9.0
orjson>=3.9.0
EOF
}

# Function to create main.py wrapper for an agent
create_main_wrapper() {
    local agent_dir_name=$1
    local agent_tf_name=$2

    cat > "$BUILD_DIR/$agent_tf_name/main.py" << 'WRAPPER_EOF'
#!/usr/bin/env python3
"""
AgentCore Runtime Entry Point for Galderma TrackWise Agent.
This wrapper loads the Strands agent and handles AgentCore invocations.

IMPORTANT: This uses BedrockAgentCoreApp as required by AgentCore Runtime.
"""
import json
import logging
import os
import sys
import traceback

# Configure logging for CloudWatch
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "agent": "%(name)s", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

# Get agent name from environment (set by Terraform)
AGENT_NAME = os.environ.get("AGENT_NAME", "unknown")
logger.info(f"Initializing agent: {AGENT_NAME}")

WRAPPER_EOF

    # Add agent-specific import
    cat >> "$BUILD_DIR/$agent_tf_name/main.py" << EOF

# Import the agent module
try:
    from ${agent_dir_name}.agent import invoke as agent_invoke
    logger.info(f"Agent module '${agent_dir_name}' loaded successfully")
except ImportError as e:
    logger.error(f"Failed to import agent module: {e}")
    agent_invoke = None
EOF

    cat >> "$BUILD_DIR/$agent_tf_name/main.py" << 'WRAPPER_EOF'


# Import BedrockAgentCoreApp
try:
    from bedrock_agentcore.runtime import BedrockAgentCoreApp
    app = BedrockAgentCoreApp()
    USE_AGENTCORE = True
except ImportError:
    # Fallback for local testing without bedrock_agentcore
    USE_AGENTCORE = False
    logger.warning("BedrockAgentCoreApp not available, using fallback mode")


def invoke_handler(event: dict, context=None) -> dict:
    """
    AgentCore Runtime handler.

    Args:
        event: Input event (dict with 'prompt' key or raw payload)
        context: Optional context from AgentCore

    Returns:
        dict: Response from agent or error
    """
    logger.info(f"Received event: {json.dumps(event, default=str)[:500]}")

    if agent_invoke is None:
        return {
            "success": False,
            "error": f"Agent module '{AGENT_NAME}' failed to load"
        }

    try:
        # Extract prompt from various formats
        if isinstance(event, dict):
            payload = event.get("prompt") or event.get("inputText") or event
        else:
            payload = event

        # If payload is a string, try to parse as JSON
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                # Keep as string if not valid JSON
                pass

        # Call the agent's invoke function
        result = agent_invoke(payload)

        logger.info(f"Agent returned: {str(result)[:500]}")
        return result

    except Exception as e:
        error_msg = f"Agent invocation failed: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return {
            "success": False,
            "error": error_msg,
            "traceback": traceback.format_exc()
        }


# Register with BedrockAgentCoreApp if available
if USE_AGENTCORE:
    @app.entrypoint
    def handler(event: dict, context=None) -> dict:
        return invoke_handler(event, context)


if __name__ == "__main__":
    if USE_AGENTCORE:
        # Start the AgentCore app (listens on port 8080)
        logger.info("Starting BedrockAgentCoreApp on port 8080")
        app.run()
    else:
        # Local testing fallback
        test_event = {"prompt": "ping"}
        result = invoke_handler(test_event)
        print(json.dumps(result, indent=2, default=str))
WRAPPER_EOF
}

# Function to install dependencies into the package
install_dependencies() {
    local agent_tf_name=$1
    local agent_build_dir="$BUILD_DIR/$agent_tf_name"

    echo "Installing dependencies..."

    # Create a temporary virtual environment for clean dependency resolution
    local venv_dir="$BUILD_DIR/.venv_$agent_tf_name"
    rm -rf "$venv_dir"
    $PYTHON_VERSION -m venv "$venv_dir"

    # Activate and install
    source "$venv_dir/bin/activate"
    pip install --upgrade pip wheel > /dev/null

    # Install dependencies into the agent directory
    # IMPORTANT: AgentCore Runtime uses ARM64 (Graviton) - must use aarch64 binaries!
    # NO FALLBACK - we must ensure ONLY ARM64 binaries are included
    pip install \
        --target "$agent_build_dir" \
        --platform manylinux2014_aarch64 \
        --python-version 3.12 \
        --implementation cp \
        --only-binary=:all: \
        -r "$agent_build_dir/requirements.txt"

    deactivate
    rm -rf "$venv_dir"

    # CRITICAL: Remove any x86_64 binaries that might have been included
    # AgentCore will fail if ANY x86_64 binary is present
    echo "Cleaning x86_64 binaries (if any)..."
    find "$agent_build_dir" -name "*x86_64*" -type f -delete 2>/dev/null || true
    find "$agent_build_dir" -name "*x86-64*" -type f -delete 2>/dev/null || true

    # Remove unnecessary files to reduce ZIP size
    find "$agent_build_dir" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$agent_build_dir" -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
    find "$agent_build_dir" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
    find "$agent_build_dir" -name "*.pyc" -delete 2>/dev/null || true
    find "$agent_build_dir" -name "*.pyo" -delete 2>/dev/null || true

    echo "✓ Dependencies installed (ARM64 only)"
}

# Function to package a single agent
package_agent() {
    local agent_tf_name=$1
    local agent_dir_name=$(get_agent_dir "$agent_tf_name")

    if [ -z "$agent_dir_name" ]; then
        echo "ERROR: Unknown agent: $agent_tf_name"
        return 1
    fi

    echo "----------------------------------------"
    echo "Packaging agent: $agent_tf_name"
    echo "Directory: $agent_dir_name"
    echo "----------------------------------------"

    # Create agent build directory
    local agent_build_dir="$BUILD_DIR/$agent_tf_name"
    rm -rf "$agent_build_dir"
    mkdir -p "$agent_build_dir"

    # Copy agent code
    if [ -d "$AGENTS_DIR/$agent_dir_name" ]; then
        cp -r "$AGENTS_DIR/$agent_dir_name" "$agent_build_dir/"
        echo "✓ Copied agent code: $agent_dir_name"
    else
        echo "ERROR: Agent directory not found: $AGENTS_DIR/$agent_dir_name"
        return 1
    fi

    # Copy shared library
    if [ -d "$AGENTS_DIR/shared" ]; then
        cp -r "$AGENTS_DIR/shared" "$agent_build_dir/"
        echo "✓ Copied shared library"
    else
        echo "WARNING: Shared library not found"
    fi

    # Create main.py wrapper
    create_main_wrapper "$agent_dir_name" "$agent_tf_name"
    echo "✓ Created main.py wrapper"

    # Create minimal requirements.txt
    create_minimal_requirements "$agent_tf_name"
    echo "✓ Created requirements.txt"

    # Install dependencies into the package
    install_dependencies "$agent_tf_name"

    # Create ZIP file
    local zip_file="$BUILD_DIR/$agent_tf_name.zip"
    cd "$agent_build_dir"
    zip -rq "$zip_file" . -x "*.pyc" -x "__pycache__/*" -x ".DS_Store" -x "*.dist-info/*"
    cd "$PROJECT_ROOT"
    echo "✓ Created ZIP: $zip_file"

    # Get ZIP size
    local zip_size=$(ls -lh "$zip_file" | awk '{print $5}')
    echo "  ZIP size: $zip_size"

    # Upload to S3
    echo "Uploading to S3..."
    AWS_PROFILE="$AWS_PROFILE" aws s3 cp "$zip_file" \
        "s3://$S3_BUCKET/agents/$agent_tf_name/agent.zip" \
        --region "$AWS_REGION" > /dev/null
    echo "✓ Uploaded to s3://$S3_BUCKET/agents/$agent_tf_name/agent.zip"

    echo ""
}

# Main execution
if [ -n "$1" ]; then
    # Package single agent
    package_agent "$1"
else
    # Package all agents
    echo "$AGENTS" | while IFS=: read -r agent_tf_name agent_dir_name; do
        package_agent "$agent_tf_name"
    done
fi

echo "=========================================="
echo "Packaging complete!"
echo "=========================================="
echo ""
echo "Verify uploads:"
echo "  AWS_PROFILE=$AWS_PROFILE aws s3 ls s3://$S3_BUCKET/agents/ --recursive --region $AWS_REGION"
echo ""
