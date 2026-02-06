---
name: prime
description: Prime Claude Code context (rules + product + code) after /clear
allowed-tools: Read, Bash, Glob, Grep
---

# Context Prime — Galderma TrackWise AI Autopilot

Purpose: After `/clear`, reload **rules**, **what is being built**, and **where the code lives**, without bloating memory.

---

## Phase 0: Hard Reset (MANDATORY)

This command assumes `/clear` was just executed.
If not, STOP and run `/clear` first.

---

## Phase 1: Global Rules (MANDATORY)

### Load `CLAUDE.md` (Source of Truth)

```bash
cat .claude/CLAUDE.md
```

Rules are NOT duplicated here.
CLAUDE.md is the only source of truth for architecture, infra, security, and AI policies.

---

## Phase 2: Product Context (MANDATORY)

### Product Definition

| Field              | Value                                    |
| ------------------ | ---------------------------------------- |
| **Product**        | Galderma TrackWise AI Autopilot          |
| **Type**           | Sales Demo — AI-First, 10-Agent Mesh     |
| **AI Framework**   | AWS Strands Agents SDK                   |
| **AI Runtime**     | AWS Bedrock AgentCore                    |
| **LLM**            | Gemini 3 Pro (`gemini-3-pro-preview`) via Strands GeminiModel |
| **Phase**          | Demo-ready (all 3 implementation phases complete) |

### Current Focus

Sales demo for Galderma: automated complaints processing via 10-agent mesh on Bedrock AgentCore. All agents use Gemini 3 Pro with temperature tiering (0.3/0.5/0.8). Backend uses in-memory simulator (Python dicts, not DynamoDB for demo). Frontend uses React 19 + TanStack Query + Zustand + Tailwind CSS (Apple Liquid Glass theme, full PT-BR localization).

---

## Phase 3: Codebase Orientation (MANDATORY)

### High-Level Repository Map (NO DUMPS)

```bash
ls -la
```

**Key areas:**

| Directory      | Purpose                                  |
| -------------- | ---------------------------------------- |
| `frontend/`    | React 19 + Vite + TanStack Query + Tailwind CSS |
| `backend/`     | FastAPI simulator (in-memory demo data)  |
| `agents/`      | 10 Strands Agents + shared models/tools  |
| `infra/`       | Terraform modules (AgentCore, S3, CloudFront, API Proxy) |
| `docs/prd/`    | PRD, Agent Architecture, Data Model, UI Design, Demo Script |
| `.claude/`     | Claude Code commands, rules, CLAUDE.md   |

### 10-Agent Mesh Architecture

```
TrackWise Simulator -> AgentCore Gateway -> A2A Agent Mesh (10 agents) -> Memory/Ledger
                                                |
                                          Agent Room UI (React)
```

| Agent | Temp | Purpose |
| ----- | ---- | ------- |
| Observer | 0.5 | Orchestrator — routes events to specialists |
| Case Understanding | 0.5 | Classifies cases (19 products, 6 categories) |
| Recurring Detector | 0.5 | Pattern matching with weighted similarity |
| Compliance Guardian | 0.3 | 5 policy rules validation (critical) |
| Resolution Composer | 0.3 | Multi-language resolution text (critical) |
| Inquiry Bridge | 0.5 | Linked case cascade closure |
| Writeback | 0.5 | Case closure execution |
| Memory Curator | 0.5 | Memory updates from feedback |
| CSV Pack | 0.5 | Compliance artifacts generation |
| SAC Generator | 0.8 | Brazilian consumer complaint generation (creative) |

All agents use **Gemini 3 Pro** (`gemini-3-pro-preview`) via Strands `GeminiModel`.

### Infrastructure (Terraform)

| Module | Purpose |
| ------ | ------- |
| `infra/modules/agentcore/runtime/` | 10 agent runtimes + simulator on AgentCore |
| `infra/modules/agentcore/gateway/` | AgentCore Gateway for MCP tools |
| `infra/modules/api-proxy/` | Lambda translating REST -> AgentCore invocations |
| `infra/modules/s3/` | Artifacts + frontend buckets |
| `infra/modules/cloudfront/` | CDN for frontend |
| `infra/environments/dev/` | Dev environment composition |

### Deployed URLs

| Resource | URL |
| -------- | --- |
| Frontend (CloudFront) | `https://dkqkiifu9ljdu.cloudfront.net` |
| API (Lambda Proxy) | `https://jnlw7jnztepo4kqqoadolsl6bu0zjjlu.lambda-url.us-east-2.on.aws/` |

---

## Phase 4: Current Work Context (MANDATORY)

```bash
git branch --show-current
git status --short
git log --oneline -5
```

---

## Phase 5: Architecture Snapshot (CONCEPTUAL)

```text
Frontend (React 19 + Vite)
  -> CloudFront CDN
    -> Lambda API Proxy (REST -> AgentCore)
      -> AgentCore Simulator Runtime (FastAPI in-memory)
      -> AgentCore Agent Runtimes (10 Strands Agents, all Gemini 3 Pro)
           |- A2A Protocol (JSON-RPC on port 9000)
           |- AgentCore Memory (STM + LTM strategies)
           |- DynamoDB Ledger (append-only, SHA-256 hash chain)
           '- S3 Artifacts (agent ZIP deployments)
```

---

## Phase 6: Documentation Index (REFERENCE ONLY)

**Do NOT load these during prime.** Reference when needed.

| Document | When to Read |
|----------|--------------|
| `docs/prd/PRD.md` | Main requirements |
| `docs/prd/AGENT_ARCHITECTURE.md` | Agent specs, A2A contracts, system prompts |
| `docs/prd/DATA_MODEL.md` | JSON schemas for Case, Run, Ledger Entry |
| `docs/prd/UI_DESIGN_SYSTEM.md` | UI design specs, Tailwind tokens |
| `docs/prd/BUILD_SPEC.md` | Repo structure, implementation guide |
| `docs/prd/DEMO_SCRIPT.md` | 9-step demo flow with killer moments |

---

## Phase 7: Prime Complete (MANDATORY NEXT STEP)

Before writing any code:

1. Restate the key constraints from CLAUDE.md
2. State what you are about to build or change
3. Create a PLAN
4. Only then implement

---

## PRIME AUDIT RULE (MANDATORY)

`/prime` MUST stay lightweight.

**NOT allowed here:**
- Large file lists
- Sprint logs
- Changelogs
- Component inventories
- Full architecture documents

If more detail is needed -> open the specific document.
