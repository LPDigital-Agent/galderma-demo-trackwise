# Galderma TrackWise AI Agents

Multi-agent system for TrackWise complaint processing using AWS Strands Agents SDK and Bedrock AgentCore Runtime.

## Architecture

9 specialized agents working in an A2A (Agent-to-Agent) mesh:

| Agent | Model | Purpose |
|-------|-------|---------|
| **Observer** | Claude Haiku | Event routing and orchestration |
| **Case Understanding** | Claude Haiku | Complaint classification and extraction |
| **Recurring Detector** | Claude Haiku | Pattern matching and memory queries |
| **Compliance Guardian** | Claude OPUS | Policy validation and gating |
| **Resolution Composer** | Claude OPUS | Multi-language response generation |
| **Inquiry Bridge** | Claude Haiku | Linked inquiry handling |
| **Writeback** | Claude Haiku | TrackWise API integration |
| **Memory Curator** | Claude Haiku | Learning and memory management |
| **CSV Pack** | Claude Haiku | Compliance documentation generation |

## Development

```bash
# Install dependencies
uv sync

# Run tests
uv run pytest

# Run linting
uv run ruff check .

# Format code
uv run ruff format .
```

## Deployment

Agents are deployed to AWS Bedrock AgentCore Runtime using ZIP packages:

```bash
# Package agents for deployment
./scripts/package-agents.sh

# Deploy via Terraform
cd infra/environments/dev
terraform apply
```

## License

Proprietary - Galderma / L&P Digital
