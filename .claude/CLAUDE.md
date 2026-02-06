# CLAUDE.md

This file provides **GLOBAL, NON-NEGOTIABLE guidance** to Claude Code (`claude.ai/code`) for this repo.

> **CLAUDE.md MEMORY BEST PRACTICE (MANDATORY):** Root `CLAUDE.md` MUST stay **short** and universally applicable. Use **progressive disclosure**: move detailed specs to `docs/` (or module `CLAUDE.md`) and reference them here. :contentReference[oaicite:3]{index=3}

To be used on web research we are in year 2026.

---

<!-- ===================================================== -->
<!-- 🔒 IMMUTABLE BLOCK – DO NOT MODIFY OR REMOVE 🔒       -->
<!-- THIS SECTION IS PERMANENT AND NON-NEGOTIABLE          -->
<!-- ANY CHANGE, REMOVAL, OR REWRITE IS STRICTLY FORBIDDEN -->
<!-- ===================================================== -->

## 🔒 [IMMUTABLE][DO-NOT-REMOVE][AI-FIRST][AGENTIC][AWS-STRANDS][BEDROCK-AGENTCORE]

## 1) Core Architecture (NON-NEGOTIABLE)

- **AI-FIRST / AGENTIC (MANDATORY):** This system is 100% Agentic. Traditional client-server, REST-only, or “normal Lambda microservice” architecture is FORBIDDEN. Lambda is allowed ONLY as an execution substrate required by Bedrock AgentCore.

- **AGENT FRAMEWORK (MANDATORY):** ALL agents MUST use **AWS Strands Agents**.
  - Gemini provider for Strands: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/model-providers/gemini/
  - Strands official docs (source of truth):
    - https://strandsagents.com/latest/
    - https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-frameworks/strands-agents.html
    - https://github.com/strands-agents/sdk-python

- **AGENT RUNTIME (MANDATORY):** ALL agents run on **AWS Bedrock AgentCore** (Runtime + Memory + Gateway + Observability + Security).

## 2) LLM Policy (IMMUTABLE)

- **LLM POLICY (IMMUTABLE & MANDATORY):** ALL agents use **Gemini 3.0 Pro** (`gemini-3-pro-preview`) via Strands `GeminiModel` provider.
  - **Temperature tiering** controls agent behavior (not model tiering):
    - Critical agents (Compliance Guardian, Resolution Composer): **temperature 0.3**
    - Operational agents (Observer, Case Understanding, Recurring Detector, Inquiry Bridge, Writeback, Memory Curator, CSV Pack): **temperature 0.5**
    - Creative agents (SAC Generator): **temperature 0.8**
  - Centralized via `config.get_model()` in `agents/shared/config.py`.

## 3) Source of Truth & Recency (IMMUTABLE)

- **REAL STATE OVER DOCUMENTATION (MANDATORY):** Always trust: codebase + Terraform/IaC + real AWS state. If docs disagree, reality wins.
- **RECENCY CHECK (MEGA MANDATORY):** If you are unsure or data may be outdated (we are in 2026), you MUST consult current official docs + internet before concluding.

## 4) Agent Behavior Doctrine (IMMUTABLE)

- **AGENT LOOP (IMMUTABLE & MEGA MANDATORY):** ALL agents MUST follow **OBSERVE → THINK → LEARN → ACT**, with **HUMAN-IN-THE-LOOP** always present for approvals when confidence is low or actions are high-impact.
- AGI-LIKE BEHAVIOR (MANDATORY):** Agent must behave AGI-like with iterative learning cycles. Before changing/documenting this behavior, explore the real codebase and validate against current best practices.

- **PROMPT LANGUAGE (IMMUTABLE):** ALL agent system prompts/tool descriptions MUST be ENGLISH. UI messages may be pt-BR.

## 5) Memory & MCP (IMMUTABLE)

- **AGENTCORE MEMORY (IMMUTABLE & MANDATORY):** Agents MUST use the Bedrock AgentCore managed memory model (STM/LTM/strategies). Do NOT implement custom memory outside AgentCore without explicit approval.
  - https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html

- **MCP ACCESS (MANDATORY):** All MCP tools/servers MUST be accessed ONLY via **AgentCore Gateway**. Never call tool endpoints directly.

- **BEDROCK AGENTCORE MCP (MANDATORY):** For communicating/testing/validating tool usage, prefer AgentCore MCP/Gateway patterns (tools/list, tools/call) and validate against current AgentCore MCP docs.

## 6) Execution Discipline (IMMUTABLE)

- **CONTEXT FIRST (MANDATORY):** Think first. Read relevant files before answering or changing anything. No speculation about code you have not opened.
- **MAJOR CHANGES REQUIRE APPROVAL (MANDATORY):** Before any major refactor/architecture change, get explicit approval.
- **SIMPLICITY FIRST (MANDATORY):** Minimal change, minimal blast radius.
- **CHANGE SUMMARY (MANDATORY):** Provide a short high-level summary of what changed and why.
- **BUGFIX DISCIPLINE (MANDATORY):** Fixes MUST be global (scan entire codebase for similar issues). Fixes MUST be executed in PLAN MODE and discussed first.

## 7) Tooling Enforcement (IMMUTABLE)

- **SUBAGENTS / SKILLS / MCP (MEGA MANDATORY):** For EVERY dev task, Claude Code MUST use SubAgents + relevant Skills + required MCP sources (Context7 + AWS docs + AgentCore docs + Terraform MCP). If not used → STOP and ask approval.

## 8) Compaction + Continuous Prime (IMMUTABLE)

- **CONTEXT WINDOW (MANDATORY):** If context > ~60% → STOP → re-read this CLAUDE.md → restate constraints + plan → use `/compact` (or `/clear` + `/prime`).
- **COMPACTION WORKFLOW (IMMUTABLE):** BEFORE `/compact`: run `/sync-project`. AFTER `/compact`: run `/prime` (or post-compact prime injection).
- **HOOKS ENFORCEMENT (MANDATORY):**
  - UserPromptSubmit MUST inject IMMUTABLE rules + `docs/CONTEXT_SNAPSHOT.md`
  - Stop MUST update `docs/CONTEXT_SNAPSHOT.md` and append `docs/WORKLOG.md`
  - If post-turn update fails → Stop hook MUST BLOCK (unless `CLAUDE_HOOKS_ALLOW_FAIL=true`)
  - Hook docs: `docs/Claude Code/HOOKS.md`  
  (Hooks events and enforcement are documented by Anthropic/Claude Docs.) :contentReference[oaicite:4]{index=4}

## 9) AWS / Infra / Security (IMMUTABLE)

- **AUTH (MANDATORY):** NO AWS Amplify. Cognito only. Direct API usage.
- **AWS CONFIG (MANDATORY):**
  - Account: `176545286005`
  - Region: `us-east-2`
  - AWS CLI profile MUST be the one created for the account 176545286005
- **INFRA (MANDATORY):** Terraform ONLY. No CloudFormation/SAM. No local deploys. GitHub Actions only.
- **SDLC + CLEAN CODE + PYTHON (MANDATORY):** Follow SDLC, Clean Code, and Python best practices (tests, CI/CD, lint/format, types where applicable, maintainable code).
- **SECURITY (MANDATORY):** Security-first + pentest-ready (OWASP/NIST/MITRE/CIS/AWS Security/Microsoft SDL).

## 🧠 LLM = BRAIN / PYTHON = HANDS (MANDATORY ENGINEERING PRINCIPLE)

Research across agentic frameworks (LangChain, Semantic Kernel, AutoGen) and engineering best practices (OpenAI/Anthropic) converges on a reliable pattern:

- **LLM = "Brain"** → decision-making, reasoning, planning, intent extraction  
- **Python = "Hands"** → deterministic execution, parsing, validation, networking, retries

This principle MUST be used to ensure **reliability, cost-efficiency, and speed**.

---

### 1) HTTP Requests & Responses — **Python (Deterministic)**

**Verdict:** Python Code (Deterministic)

**Why:** LLMs do not actually execute network calls; they can hallucinate request/response formats. Asking an LLM to “perform a GET request” is unreliable.

**Best Practice: Tool Use Pattern**
- **LLM (Reasoning):** decides which API/tool to call and the parameters  
  Example intent: `{"tool": "get_weather", "city": "London"}`
- **Python (Execution):** performs the real call (`requests`/`httpx`), handles auth, headers, retries
- **Python (Error Handling):** catches failures (e.g., 500), then returns the error back to the LLM so it can choose the next step (retry, fallback source, HIL)

---

### 2) JSON Parsing — **Python (Deterministic)**

**Verdict:** Python Code

**Why:** API JSON is already structured. Feeding large JSON into an LLM is slow, expensive, and prone to hallucinating keys.

**Best Practices**
- **Always parse JSON in Python:** `json.loads()` (fast + accurate)
- **Filter in Python first:** if the payload is large (e.g., 5MB), reduce to relevant fields BEFORE sending to LLM (saves tokens, improves focus)

---

### 3) Data Extraction — **Hybrid (Context Dependent)**

**Verdict:** Depends on the source

**Scenario A: Unstructured text (PDF, emails, HTML) → LLM**
- Regex-only approaches are brittle for messy human text
- Use the LLM for extraction BUT enforce **structured outputs** (e.g., Pydantic schemas) so the result is clean JSON

**Scenario B: Structured data (Excel, API JSON) → Python**
- Do NOT send huge tables (e.g., 10k rows) to the LLM just to find fields/columns
- Use Python (`pandas`, native logic) to locate/filter/aggregate first

---

## 🥪 Recommended Architecture: "Sandwich Pattern" (MANDATORY)

Production-grade agentic workflows MUST follow:

**CODE → LLM → CODE**

- **Code (Preparation):** networking, auth, HTML cleaning, pre-filtering, normalization  
- **LLM (Reasoning):** analyze clean inputs, infer intent/meaning, decide actions  
- **Code (Validation):** validate output types/constraints (dates, enums, integers, schemas) before persisting or executing actions

---

<!-- ===================================================== -->
<!-- 🔒 END OF IMMUTABLE BLOCK                             -->
<!-- ===================================================== -->

---

## Project: Galderma TrackWise AI Autopilot (DEMO)

A **sales demo** showcasing AI-first, fully agentic TrackWise Complaints Autopilot using a 10-agent mesh architecture on AWS Bedrock AgentCore.

### Key Documentation

| Document | Purpose |
|----------|---------|
| `docs/prd/PRD.md` | Main requirements document |
| `docs/prd/AGENT_ARCHITECTURE.md` | 10 agents specs, A2A contracts, system prompts |
| `docs/prd/DATA_MODEL.md` | JSON schemas for Case, Run, Ledger Entry |
| `docs/prd/UI_DESIGN_SYSTEM.md` | Dark glassmorphism specs, Tailwind tokens |
| `docs/prd/BUILD_SPEC.md` | Repo structure, implementation guide, commands |
| `docs/prd/DEMO_SCRIPT.md` | 9-step demo flow with killer moments |

### Architecture Overview

```
TrackWise Simulator → AgentCore Gateway → A2A Agent Mesh (10 agents) → Memory/Ledger
                                              ↓
                                        Agent Room UI (React)
```

**10 Agents** (via A2A protocol on port 9000):
- **All agents**: Gemini 3 Pro (`gemini-3-pro-preview`) — critical agents (Guardian, Composer) use temp 0.3, operational agents temp 0.5, SAC Generator temp 0.8

### Development Commands

```bash
# Prerequisites: Python 3.12+, Node 20+, Terraform 1.7+, Docker 24+, uv, pnpm

# Install dependencies
cd backend && uv sync && cd ..
cd agents && uv sync && cd ..
cd frontend && pnpm install && cd ..

# Start local development
docker-compose up -d db redis
cd backend && uv run uvicorn src.main:app --reload &
cd frontend && pnpm dev

# Run tests
cd backend && uv run pytest
cd agents && uv run pytest
cd frontend && pnpm test

# Lint
cd backend && uv run ruff check .
cd agents && uv run ruff check .
cd frontend && pnpm lint

# Infrastructure (Terraform)
cd infra/environments/dev && terraform init && terraform plan
cd infra/environments/prod && terraform apply

# Database
cd backend && uv run alembic upgrade head  # migrations
cd backend && uv run python scripts/seed_data.py  # seed data

# Reset demo data
./scripts/reset-demo.sh
```

### AWS Configuration

```bash
# Profile for account 176545286005, region us-east-2
aws configure --profile galderma-demo
aws sts get-caller-identity --profile galderma-demo
```

### Key Terminology

- **CSV** = Computer System Validation (NOT Comma Separated Values) - 21 CFR Part 11 compliance documentation
- **A2A** = Agent-to-Agent protocol (JSON-RPC on port 9000)
- **STM/LTM** = Short-term/Long-term Memory (AgentCore Memory strategies)
