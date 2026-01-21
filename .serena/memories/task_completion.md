# Task Completion Checklist

## Before Completing Any Task

### 1. Code Quality
- [ ] Run linting: `cd backend && uv run ruff check .` (Python)
- [ ] Run linting: `cd frontend && pnpm lint` (TypeScript/React)
- [ ] Ensure type hints are present (Python) or strict TypeScript types

### 2. Testing
- [ ] Run backend tests: `cd backend && uv run pytest`
- [ ] Run agent tests: `cd agents && uv run pytest`
- [ ] Run frontend tests: `cd frontend && pnpm test`

### 3. Documentation
- [ ] Update relevant docs in `docs/prd/` if architecture changed
- [ ] Update `docs/WORKLOG.md` with changes made
- [ ] Update `docs/CONTEXT_SNAPSHOT.md` if context changed

### 4. Security (MANDATORY from CLAUDE.md)
- [ ] No secrets in code (use environment variables)
- [ ] Follow OWASP/NIST/CIS guidelines
- [ ] No direct credential exposure

### 5. Architecture Compliance (from CLAUDE.md)
- [ ] AI-First/Agentic approach maintained
- [ ] AWS Strands Agents used for all agents
- [ ] AgentCore used for runtime/memory/gateway
- [ ] Terraform only (NO CloudFormation)
- [ ] Cognito only (NO Amplify)
- [ ] Sandwich pattern followed (CODE → LLM → CODE)

### 6. Git
- [ ] Meaningful commit message (conventional commits preferred)
- [ ] No sensitive data committed
- [ ] Branch follows naming convention

## Quick Commands
```bash
# Full validation
make lint && make test

# Or manually:
cd backend && uv run ruff check . && uv run pytest
cd agents && uv run ruff check . && uv run pytest
cd frontend && pnpm lint && pnpm test
```

## IMPORTANT RULES (from CLAUDE.md)
- **CONTEXT FIRST**: Read relevant files before changing anything
- **MAJOR CHANGES REQUIRE APPROVAL**: Get explicit approval before refactoring
- **SIMPLICITY FIRST**: Minimal change, minimal blast radius
- **BUGFIX DISCIPLINE**: Scan entire codebase for similar issues
- **SUBAGENTS/SKILLS/MCP**: Use them for every dev task
