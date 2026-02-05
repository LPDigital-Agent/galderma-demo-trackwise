# CLAUDE.md — Galderma TrackWise AI Autopilot (DEMO)

We are in year 2026. Always verify with current official docs before concluding.

## Core Rules (IMMUTABLE)

See @docs/IMMUTABLE_RULES.md for the complete, non-negotiable rules governing this repo.

Key constraints: **AI-FIRST** architecture, **Strands SDK**, **Bedrock AgentCore**, **Claude 4.5 family**, **OBSERVE→THINK→LEARN→ACT** loop, **HUMAN-IN-THE-LOOP** for high-impact decisions.

## Engineering Principle

See @docs/SANDWICH_PATTERN.md — **CODE → LLM → CODE** is mandatory for all agent workflows.

## Project Overview

A **sales demo** showcasing AI-first, fully agentic TrackWise Complaints Autopilot using a 9-agent mesh architecture on AWS Bedrock AgentCore.

```
TrackWise Simulator → AgentCore Gateway → A2A Agent Mesh (9 agents) → Memory/Ledger
                                              ↓
                                        Agent Room UI (React)
```

## Directory Structure

| Directory | Purpose | Module Docs |
|-----------|---------|-------------|
| `backend/` | FastAPI API layer (ingress adapter) | See `backend/CLAUDE.md` |
| `agents/` | 9 Strands agents + A2A protocol | See `agents/CLAUDE.md` |
| `frontend/` | React Agent Room UI (dark glassmorphism) | See `frontend/CLAUDE.md` |
| `infra/` | Terraform environments + modules | See `infra/CLAUDE.md` |
| `scripts/` | Utility scripts (reset, seed, verify) | — |
| `docs/prd/` | PRD, architecture, data model, UI specs | — |

## Key Documentation

| Document | Purpose |
|----------|---------|
| `docs/prd/PRD.md` | Main requirements |
| `docs/prd/AGENT_ARCHITECTURE.md` | 9 agents specs, A2A contracts, system prompts |
| `docs/prd/DATA_MODEL.md` | JSON schemas for Case, Run, Ledger Entry |
| `docs/prd/UI_DESIGN_SYSTEM.md` | Dark glassmorphism specs, Tailwind tokens |
| `docs/prd/BUILD_SPEC.md` | Repo structure, implementation guide |
| `docs/prd/DEMO_SCRIPT.md` | 9-step demo flow with killer moments |

## Commands

Run `make help` for all available targets. Key shortcuts:

```bash
make install    # Install all deps (backend, agents, frontend)
make dev        # Start local development (all services)
make test       # Run all tests
make lint       # Lint all code
make reset      # Reset demo data
```

## AWS Config

Account `176545286005` · Region `us-east-2` · Profile `galderma-demo`

## Key Terminology

- **CSV** = Computer System Validation (NOT Comma Separated Values) — 21 CFR Part 11
- **A2A** = Agent-to-Agent protocol (JSON-RPC on port 9000)
- **STM/LTM** = Short-term/Long-term Memory (AgentCore Memory strategies)

## Context Management

- Compaction threshold: **75%** — if context > 75% → STOP → `/compact` (or `/clear` + `/prime`)
- BEFORE `/compact`: run `/sync-project`
- AFTER `/compact`: run `/prime`
- See @docs/IMMUTABLE_RULES.md §8 for hooks enforcement details
