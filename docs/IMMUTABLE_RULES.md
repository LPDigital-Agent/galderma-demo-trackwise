# IMMUTABLE RULES — Galderma TrackWise AI Autopilot

> **STATUS:** IMMUTABLE — DO NOT MODIFY OR REMOVE
> **SCOPE:** All code, infrastructure, agents, and documentation in this repo

---

## 1) Core Architecture (NON-NEGOTIABLE)

- **AI-FIRST / AGENTIC (MANDATORY):** This system is 100% Agentic. Traditional client-server, REST-only, or "normal Lambda microservice" architecture is FORBIDDEN. Lambda is allowed ONLY as an execution substrate required by Bedrock AgentCore.

- **AGENT FRAMEWORK (MANDATORY):** ALL agents MUST use **AWS Strands Agents**.
  - Strands official docs (source of truth):
    - https://strandsagents.com/latest/
    - https://github.com/strands-agents/sdk-python
  - Gemini provider: https://strandsagents.com/latest/documentation/docs/user-guide/concepts/model-providers/gemini/

- **AGENT RUNTIME (MANDATORY):** ALL agents run on **AWS Bedrock AgentCore** (Runtime + Memory + Gateway + Observability + Security).

## 2) LLM Policy (IMMUTABLE)

- ALL agents MUST use **Claude 4.5 FAMILY**.
- CRITICAL agents (Compliance Guardian, Resolution Composer) MUST use **Claude 4.5 Opus**.
- Non-critical agents MAY use **Claude 4.5 Haiku**.
- Temporary exception for Strands SDK limitations applies ONLY as currently stated.

## 3) Source of Truth & Recency (IMMUTABLE)

- **REAL STATE OVER DOCUMENTATION:** Always trust: codebase + Terraform/IaC + real AWS state. If docs disagree, reality wins.
- **RECENCY CHECK (MEGA MANDATORY):** If you are unsure or data may be outdated (we are in 2026), you MUST consult current official docs + internet before concluding.

## 4) Agent Behavior Doctrine (IMMUTABLE)

- **AGENT LOOP:** ALL agents MUST follow **OBSERVE → THINK → LEARN → ACT**, with **HUMAN-IN-THE-LOOP** always present for approvals when confidence is low or actions are high-impact.
- **AGI-LIKE BEHAVIOR:** Agent must behave AGI-like with iterative learning cycles. Before changing/documenting this behavior, explore the real codebase and validate against current best practices.
- **PROMPT LANGUAGE:** ALL agent system prompts/tool descriptions MUST be ENGLISH. UI messages may be pt-BR.

## 5) Memory & MCP (IMMUTABLE)

- **AGENTCORE MEMORY:** Agents MUST use the Bedrock AgentCore managed memory model (STM/LTM/strategies). Do NOT implement custom memory outside AgentCore without explicit approval.
  - https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html
- **MCP ACCESS:** All MCP tools/servers MUST be accessed ONLY via **AgentCore Gateway**. Never call tool endpoints directly.

## 6) Execution Discipline (IMMUTABLE)

- **CONTEXT FIRST:** Think first. Read relevant files before answering or changing anything. No speculation about code you have not opened.
- **MAJOR CHANGES REQUIRE APPROVAL:** Before any major refactor/architecture change, get explicit approval.
- **SIMPLICITY FIRST:** Minimal change, minimal blast radius.
- **CHANGE SUMMARY:** Provide a short high-level summary of what changed and why.
- **BUGFIX DISCIPLINE:** Fixes MUST be global (scan entire codebase for similar issues). Fixes MUST be executed in PLAN MODE and discussed first.

## 7) Tooling Enforcement (IMMUTABLE)

- **SUBAGENTS / SKILLS / MCP (MEGA MANDATORY):** For EVERY dev task, Claude Code MUST use SubAgents + relevant Skills + required MCP sources (Context7 + AWS docs + AgentCore docs + Terraform MCP). If not used → STOP and ask approval.
- **SUBAGENT MODEL SELECTION:**
  - `haiku` — file search, grep, simple formatting, read-only exploration
  - `sonnet` — code review, test writing, documentation, refactoring
  - `opus` — architecture decisions, complex debugging, security review

## 8) Compaction + Continuous Prime (IMMUTABLE)

- **CONTEXT WINDOW:** If context > ~75% → STOP → re-read CLAUDE.md → restate constraints + plan → use `/compact` (or `/clear` + `/prime`).
- **COMPACTION WORKFLOW:** BEFORE `/compact`: run `/sync-project`. AFTER `/compact`: run `/prime` (or post-compact prime injection).
- **HOOKS ENFORCEMENT:**
  - UserPromptSubmit MUST inject IMMUTABLE rules + `docs/CONTEXT_SNAPSHOT.md`
  - Stop MUST update `docs/CONTEXT_SNAPSHOT.md` and append `docs/WORKLOG.md`
  - If post-turn update fails → Stop hook MUST BLOCK (unless `CLAUDE_HOOKS_ALLOW_FAIL=true`)

## 9) AWS / Infra / Security (IMMUTABLE)

- **AUTH:** NO AWS Amplify. Cognito only. Direct API usage.
- **AWS CONFIG:** Account `176545286005`, Region `us-east-2`, Profile for this account.
- **INFRA:** Terraform ONLY. No CloudFormation/SAM. No local deploys. GitHub Actions only.
- **SDLC:** Follow SDLC, Clean Code, and Python best practices (tests, CI/CD, lint/format, types).
- **SECURITY:** Security-first + pentest-ready (OWASP/NIST/MITRE/CIS/AWS Security/Microsoft SDL).
