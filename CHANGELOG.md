# Changelog

All notable changes to the **Galderma TrackWise AI Autopilot Demo** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Initial project structure with 6 main directories (infra, backend, agents, frontend, scripts, .github)
- CHANGELOG.md for tracking progress
- Root configuration files (.gitignore, pyproject.toml, Makefile, docker-compose.yml)
- AWS verification script (scripts/verify-aws.sh)
- GitHub Actions workflows documentation

### Infrastructure (Terraform - AWS Provider v6.28.0)
- **DynamoDB Module**: Runs, Ledger, Cases tables with GSIs
- **S3 Module**: Artifacts, CSV Packs, Frontend buckets with lifecycle policies
- **CloudWatch Module**: Agent log groups, dashboard, alarms
- **ECR Module**: Container repositories for 9 agents + simulator + UI bridge
- **AgentCore Runtime Module**: IAM roles, A2A orchestrator permissions, agent deployments
- **AgentCore Memory Module**: 3 strategies (RecurringPatterns, ResolutionTemplates, PolicyKnowledge)
- **AgentCore Gateway Module**: MCP/A2A routing, tool definitions
- **AgentCore Policy Module**: Cedar policies (POL-001 through POL-005)
- **AgentCore Identity Module**: Workload identities, OAuth2 credential provider
- **Dev Environment**: Main orchestration with all modules

### Agents Shared Infrastructure
- **Pydantic Models**: Case, CaseAnalysis, Resolution, Run, LedgerEntry, MemoryPattern, EventEnvelope
- **Memory Tools**: memory_query, memory_write, memory_delete (AgentCore Memory integration)
- **A2A Tools**: call_specialist_agent, get_agent_card (Inter-agent communication)
- **Simulator Tools**: get_case, update_case, close_case, list_cases (TrackWise Simulator API)
- **Ledger Tools**: write_ledger_entry, get_ledger_entries (Decision Ledger operations)
- **Human Review Tools**: request_human_review, check_human_approval, submit_human_feedback
- **Config**: AgentConfig with ExecutionMode, ModelId, GALDERMA_PRODUCTS taxonomy

### 9 Strands Agents (ALL COMPLETED)
- **Observer (Haiku)**: Orchestrator - validates events, routes to specialists via A2A
- **Case Understanding (Haiku)**: Classifier - extracts product, category, severity, key phrases
- **Recurring Detector (Haiku)**: Pattern Matcher - queries RecurringPatterns memory, calculates similarity
- **Compliance Guardian (OPUS)**: Gatekeeper - validates 5 policies (POL-001 through POL-005)
- **Resolution Composer (OPUS)**: Writer - generates canonical + PT/EN/ES/FR translations
- **Inquiry Bridge (Haiku)**: Coordinator - handles linked cases, cascade closures
- **Writeback (Haiku)**: Executor - pre-flight checks, retry logic, writes to Simulator
- **Memory Curator (Haiku)**: Learner - processes APPROVE/REJECT/CORRECT feedback
- **CSV Pack (Haiku)**: Documenter - generates 6 Computer System Validation artifacts

### TrackWise Simulator (AgentCore Container)
- **Pydantic Models**: Case, CaseCreate, CaseUpdate, EventEnvelope, BatchCreate
- **SimulatorAPI**: In-memory case management with create, get, update, close, list, batch operations
- **Event Emitter**: A2A integration with Observer agent via InvokeAgentRuntime
- **REST Endpoints**: /api/cases, /api/events, /api/batch, /api/stats, /api/reset
- **AgentCore Endpoints**: /ping (health), /invocations (AgentCore Runtime)
- **WebSocket Bridge**: /ws/timeline for real-time timeline updates to frontend
- **Dockerfile**: ARM64 container image with uv for AgentCore deployment
- **Demo Data**: Galderma product taxonomy, recurring pattern templates, batch generation
- **Test Suite**: pytest tests for simulator API and integration workflows

### Frontend React (ALL COMPLETED)
- **Configuration**: Vite 6.x, React 19, TypeScript 5.6, Tailwind 4.x
- **Design System**: Dark glassmorphism theme with CSS custom properties
- **State Management**: Zustand stores (mode, language, timeline)
- **Data Fetching**: TanStack Query with caching and auto-refresh
- **WebSocket**: Real-time timeline updates via /ws/timeline
- **UI Components**: GlassCard, Button, Badge, SeverityBadge, ModeBadge, LanguageToggle, ModeToggle
- **Layout**: TopBar with navigation, AppLayout with Outlet
- **Pages**: AgentRoom (dashboard), Cases, Network, Memory, Ledger, CSVPack
- **Routing**: React Router v7 with nested routes
- **Accessibility**: WCAG AA compliant, keyboard navigation, ARIA labels

### Integration + Deploy (ALL COMPLETED)
- **GitHub Actions CI**: Backend, Agents, Frontend tests + Terraform validation
- **Deploy Infrastructure**: Terraform apply + AgentCore Memory setup
- **Deploy Agents**: Build ARM64 containers, push to ECR, deploy via `agentcore launch`
- **Deploy Frontend**: Build, sync to S3, CloudFront invalidation
- **Demo Scripts**: seed-demo.sh (populate demo data), reset-demo.sh (clean slate)
- **Vite TypeScript**: Environment type definitions (vite-env.d.ts)
- **100% AgentCore**: ZERO Lambda, ZERO ECS - all via `agentcore configure && agentcore launch`

### Architecture Decisions
- **100% AWS Bedrock AgentCore Runtime** - No ECS, No Lambda, No traditional API Gateway
- **AWS Strands Agents SDK** - All 9 agents use Strands framework
- **Multi-Agent Orchestrator Pattern** - Observer as orchestrator + 8 specialist agents
- **A2A Protocol** - IAM-based InvokeAgentRuntime for inter-agent communication
- **AgentCore Suite** - Runtime, Memory, Gateway, Policy, Identity, Code Interpreter, Observability
- **Claude 4.5 Family** - OPUS for critical agents (Guardian, Composer), Haiku for operational
- **Sandwich Pattern** - CODE→LLM→CODE for all critical operations
- **Human-in-the-Loop** - Checkpoints for HIGH/CRITICAL severity, low confidence, TRAIN mode

---

## [0.1.0] - 2026-01-20

### Added
- Project initialization
- Directory structure per BUILD_SPEC.md
- Documentation foundation (PRD, AGENT_ARCHITECTURE, DATA_MODEL, UI_DESIGN_SYSTEM, BUILD_SPEC, DEMO_SCRIPT)

### Infrastructure (Planned)
- [ ] AWS Credentials Setup (fabio-dev-lpd profile)
- [ ] Terraform foundation (providers, DynamoDB, S3, CloudWatch)
- [ ] AgentCore Memory (3 strategies)
- [ ] AgentCore Gateway
- [ ] AgentCore Policy (Cedar policies)
- [ ] AgentCore Identity (workload tokens)
- [ ] AgentCore Observability

### Agents (Planned)
- [ ] Observer (Haiku) - Orchestrator
- [ ] Case Understanding (Haiku)
- [ ] Recurring Detector (Haiku)
- [ ] Compliance Guardian (OPUS) - Critical
- [ ] Resolution Composer (OPUS) - Critical
- [ ] Inquiry Bridge (Haiku)
- [ ] Writeback (Haiku)
- [ ] Memory Curator (Haiku)
- [ ] CSV Pack (Haiku)

### Frontend (Planned)
- [ ] React 19 + Vite 6.x + Tailwind 4.x
- [ ] Dark glassmorphism UI
- [ ] Timeline with WebSocket
- [ ] A2A Network visualization
- [ ] Memory browser
- [ ] Decision Ledger view
- [ ] CSV Pack generator

---

## Phase Tracking

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | AWS Credentials + Terraform Infrastructure | ✅ Complete |
| 2 | TrackWise Simulator (AgentCore Container) | ✅ Complete |
| 3 | Agents Shared Infrastructure | ✅ Complete |
| 4 | Core Agents (9 Strands Agents) | ✅ Complete |
| 5 | Frontend React | ✅ Complete |
| 6 | Integration + Deploy | ✅ Complete |

---

## 4 Killer Demo Moments

1. **Auto-close < 3s** - Recurring complaint closes automatically via AgentCore
2. **Multi-language toggle** - Instant switch between PT/EN/ES/FR
3. **Memory learning visible** - Feedback updates confidence in real-time
4. **CSV Pack + Replay** - Generate compliance pack, replay run step-by-step
