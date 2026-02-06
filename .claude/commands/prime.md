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
| **Type**           | Sales Demo — AI-First, 9-Agent Mesh      |
| **AI Framework**   | AWS Strands Agents SDK                   |
| **AI Runtime**     | AWS Bedrock AgentCore                    |
| **Phase**          | Demo-ready (all 3 implementation phases complete) |

### Current Focus

Sales demo for Galderma: automated complaints processing via 9-agent mesh on Bedrock AgentCore. Backend uses in-memory simulator (Python dicts, not DynamoDB for demo). Frontend uses React 19 + TanStack Query + Zustand + Tailwind CSS (Galderma corporate dark theme, full PT-BR localization).

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
| `agents/`      | 9 Strands Agents + shared models/tools   |
| `infra/`       | Terraform modules (AgentCore, S3, CloudFront, API Proxy) |
| `docs/prd/`    | PRD, Agent Architecture, Data Model, UI Design, Demo Script |
| `.claude/`     | Claude Code commands, rules, CLAUDE.md   |

### 9-Agent Mesh Architecture

```
TrackWise Simulator -> AgentCore Gateway -> A2A Agent Mesh (9 agents) -> Memory/Ledger
                                                |
                                          Agent Room UI (React)
```

| Agent | Model | Purpose |
| ----- | ----- | ------- |
| Observer | Haiku | Orchestrator — routes events to specialists |
| Case Understanding | Haiku | Classifies cases (19 products, 6 categories) |
| Recurring Detector | Haiku | Pattern matching with weighted similarity |
| Compliance Guardian | OPUS | 5 policy rules validation |
| Resolution Composer | OPUS | Multi-language resolution text (4 languages) |
| Inquiry Bridge | Haiku | Linked case cascade closure |
| Writeback | Haiku | Case closure execution |
| Memory Curator | Haiku | Memory updates from feedback |
| CSV Pack | Haiku | Compliance artifacts generation |

### Infrastructure (Terraform)

| Module | Purpose |
| ------ | ------- |
| `infra/modules/agentcore/runtime/` | 9 agent runtimes + simulator on AgentCore |
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
      -> AgentCore Agent Runtimes (9 Strands Agents)
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
| `docs/prd/UI_DESIGN_SYSTEM.md` | Dark glassmorphism specs, Tailwind tokens |
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
