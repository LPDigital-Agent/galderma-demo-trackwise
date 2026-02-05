# Agents — 9-Agent A2A Mesh on Strands SDK

## Purpose
The core intelligence layer. 9 specialized agents communicating via A2A protocol (JSON-RPC on port 9000), deployed to AWS Bedrock AgentCore.

## Agent Inventory

| Agent | Model | Role |
|-------|-------|------|
| Observer | Haiku | Monitors incoming TrackWise events |
| Case Understanding | Haiku | Extracts complaint structure and severity |
| Recurring Detector | Haiku | Identifies repeat complaints and patterns |
| Compliance Guardian | **Opus** | Validates regulatory compliance (21 CFR Part 11) |
| Resolution Composer | **Opus** | Generates resolution recommendations |
| Inquiry Bridge | Haiku | Handles clarification requests to humans |
| Writeback | Haiku | Writes decisions back to TrackWise |
| Memory Curator | Haiku | Manages AgentCore STM/LTM lifecycle |
| CSV Pack | Haiku | Generates Computer System Validation docs |

## Architecture
```
TrackWise Event → Observer → Case Understanding → Compliance Guardian
                                                        ↓
                 Writeback ← Resolution Composer ← Recurring Detector
                                    ↓
                              Memory Curator → AgentCore Memory (STM/LTM)
```

## Key Paths
- `{agent_name}/agent.py` — Agent entrypoint (Strands Agent class)
- `{agent_name}/tools/` — @tool decorated functions
- `{agent_name}/prompts/` — System prompts (MUST be English)
- `shared/` — Shared utilities, A2A client, Pydantic schemas
- `tests/` — pytest suite with AgentCore mocks

## Commands
```bash
uv run pytest -xvs                            # run all agent tests
uv run python -m agents.observer.agent         # run single agent locally
agentcore configure --entrypoint agent.py      # configure for deploy
agentcore launch                               # deploy to AgentCore
```

## Rules
- ALL agents MUST use Strands SDK `Agent` class
- Tools MUST use @tool decorator with typed parameters + docstrings
- Follow OBSERVE → THINK → LEARN → ACT loop
- Opus agents: complex reasoning, regulatory decisions
- Haiku agents: fast, deterministic, high-throughput tasks
- See @docs/IMMUTABLE_RULES.md for full constraints
- See @docs/SANDWICH_PATTERN.md for LLM vs Python boundaries
- See @docs/prd/AGENT_ARCHITECTURE.md for A2A contracts and system prompts
