# ============================================
# Galderma TrackWise AI Autopilot Demo
# TrackWise Simulator - Dockerfile
# ============================================
#
# Builds container for AgentCore Runtime deployment.
# Uses uv for fast dependency management.
#
# Build:
#   docker build -t galderma-trackwise-simulator .
#
# Run locally:
#   docker run -p 8080:8080 galderma-trackwise-simulator
#
# Deploy to AgentCore:
#   agentcore configure --entrypoint src/main.py
#   agentcore launch
#
# ============================================

# Use ARM64 base image with Python and uv (as recommended by AgentCore)
FROM --platform=linux/arm64 ghcr.io/astral-sh/uv:python3.11-bookworm-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Set working directory
WORKDIR /app

# Copy dependency files first (for caching)
COPY pyproject.toml ./

# Create virtual environment and install dependencies
RUN uv venv && \
    uv pip install --no-cache-dir -e .

# Copy source code
COPY src ./src

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port (AgentCore expects 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ping || exit 1

# Run the application
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
