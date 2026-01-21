# Galderma TrackWise AI Autopilot (DEMO)

## Project Purpose
Sales demo showcasing an **AI-first, fully agentic** TrackWise Complaints Autopilot for Galderma using a **9-agent mesh architecture** on AWS Bedrock AgentCore.

## Key Narrative
> "Autonomous agents can observe, learn, remember, and execute—while every step is visible, replayable, and exportable for audit/CSV."

## Important Terminology
- **CSV** = Computer System Validation (NOT Comma Separated Values) - 21 CFR Part 11 compliance documentation
- **A2A** = Agent-to-Agent protocol (JSON-RPC on port 9000)
- **STM/LTM** = Short-term/Long-term Memory (AgentCore Memory strategies)

## Main Features
1. Auto-close "known recurring" complaints
2. Auto-close Inquiry after linked Complaint resolution
3. Multi-language outputs (PT/EN/ES/FR) with instant toggle
4. CSV Validation Pack generation (demo-level)
5. Agent Room with live timeline, replay, memory inspector
6. A2A network visualization (real-time animated)

## Autopilot Modes
- **Observe** (Shadow): Agents analyze, NO writeback
- **Train**: User provides feedback, memory updated
- **Act**: Agents execute writebacks automatically

## 9 Agents Architecture
| Agent | Model | Responsibility |
|-------|-------|----------------|
| Observer | Haiku | Event normalization |
| Case Understanding | Haiku | Structure extraction |
| Recurring Detector | Haiku | Pattern matching |
| Compliance Guardian | **OPUS** | Policy enforcement |
| Resolution Composer | **OPUS** | Multi-language output |
| Inquiry Bridge | Haiku | Inquiry-Complaint linking |
| Writeback | Haiku | Simulator writebacks |
| Memory Curator | Haiku | Memory management |
| CSV Pack | Haiku | Validation documentation |

## IMPORTANT Architecture Rules (from CLAUDE.md)
- **AI-FIRST / AGENTIC MANDATORY**: Traditional REST-only architecture FORBIDDEN
- **ALL agents MUST use AWS Strands Agents**
- **ALL agents run on AWS Bedrock AgentCore**
- **Critical agents use Claude 4.5 OPUS, operational use Haiku**
- **REAL STATE OVER DOCUMENTATION**: Trust codebase + Terraform + real AWS state
- **Agent Loop**: OBSERVE → THINK → LEARN → ACT with Human-in-the-Loop
