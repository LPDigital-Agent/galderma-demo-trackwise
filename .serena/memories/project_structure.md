# Project Structure

```
galderma-demo-trackwise/
├── .github/workflows/          # CI/CD pipelines
│   ├── ci.yml                  # Lint, test, build
│   ├── deploy-infra.yml        # Terraform apply
│   └── deploy-app.yml          # Agent + frontend deploy
│
├── .claude/                    # Claude Code configuration
│   ├── CLAUDE.md               # AI assistant rules (IMMUTABLE)
│   ├── agents/                 # Subagent definitions
│   ├── commands/               # Custom slash commands
│   ├── skills/                 # Claude skills
│   └── hooks/                  # Claude hooks
│
├── docs/                       # Documentation
│   ├── CONTEXT_SNAPSHOT.md     # Current context state
│   ├── WORKLOG.md              # Work history log
│   └── prd/                    # Product requirements
│       ├── PRD.md              # Main requirements
│       ├── AGENT_ARCHITECTURE.md # Agent specifications
│       ├── DATA_MODEL.md       # JSON schemas
│       ├── UI_DESIGN_SYSTEM.md # Design system specs
│       ├── DEMO_SCRIPT.md      # Demo walkthrough
│       └── BUILD_SPEC.md       # Implementation guide
│
├── infra/                      # Terraform modules
│   ├── environments/           # Environment configs
│   │   ├── dev/
│   │   └── prod/
│   ├── modules/                # Reusable modules
│   │   ├── agentcore/          # Runtime, Memory, Gateway, Identity
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── s3/
│   │   └── cloudwatch/
│   └── shared/
│
├── backend/                    # Python backend (FastAPI)
│   ├── src/
│   │   ├── simulator/          # TrackWise Simulator
│   │   ├── gateway/            # API Gateway handlers
│   │   └── ledger/             # Decision Ledger
│   ├── tests/
│   └── pyproject.toml
│
├── agents/                     # Strands agents
│   ├── shared/                 # Common utilities
│   │   ├── config.py
│   │   ├── models.py
│   │   ├── memory.py
│   │   └── observability.py
│   ├── observer/
│   ├── case_understanding/
│   ├── recurring_detector/
│   ├── compliance_guardian/    # OPUS model
│   ├── resolution_composer/    # OPUS model
│   ├── inquiry_bridge/
│   ├── writeback/
│   ├── memory_curator/
│   ├── csv_pack/
│   ├── tests/
│   └── pyproject.toml
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI
│   │   │   ├── layout/         # Layout components
│   │   │   ├── timeline/       # Timeline view
│   │   │   ├── network/        # A2A network
│   │   │   └── memory/         # Memory inspector
│   │   ├── pages/
│   │   │   ├── AgentRoom.tsx
│   │   │   ├── Cases.tsx
│   │   │   ├── Network.tsx
│   │   │   ├── Memory.tsx
│   │   │   ├── Ledger.tsx
│   │   │   └── CSVPack.tsx
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── api/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
├── scripts/                    # Utility scripts
│   ├── reset-demo.sh
│   ├── seed-data.sh
│   └── local-dev.sh
│
├── docker-compose.yml          # Local development
├── Makefile                    # Common commands
└── README.md
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `docs/prd/` | All product requirements and specifications |
| `infra/` | Terraform infrastructure (NO CloudFormation) |
| `backend/` | Python FastAPI for simulator and gateway |
| `agents/` | AWS Strands agents (9 agents total) |
| `frontend/` | React UI with dark glassmorphism |
| `.claude/` | Claude Code configuration and rules |
