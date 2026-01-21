# Build Specification

> **Version**: 1.0
> **Last Updated**: January 2026
> **Parent Document**: [PRD.md](./PRD.md)
> **Purpose**: Technical implementation guide for developers

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Development Environment](#2-development-environment)
3. [Tech Stack Details](#3-tech-stack-details)
4. [Infrastructure (Terraform)](#4-infrastructure-terraform)
5. [Backend Implementation](#5-backend-implementation)
6. [Agent Implementation](#6-agent-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [API Contracts](#8-api-contracts)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Testing Strategy](#10-testing-strategy)
11. [Implementation Checklist](#11-implementation-checklist)
12. [Development Commands](#12-development-commands)

---

## 1. Project Structure

### 1.1 Repository Layout

```
galderma-demo-trackwise/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, build
│       ├── deploy-infra.yml          # Terraform apply
│       └── deploy-app.yml            # Agent + frontend deploy
│
├── .claude/
│   └── CLAUDE.md                     # AI assistant rules
│
├── docs/
│   └── prd/
│       ├── PRD.md
│       ├── AGENT_ARCHITECTURE.md
│       ├── DATA_MODEL.md
│       ├── UI_DESIGN_SYSTEM.md
│       ├── DEMO_SCRIPT.md
│       └── BUILD_SPEC.md             # This file
│
├── infra/                            # Terraform modules
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   └── prod/
│   ├── modules/
│   │   ├── agentcore/
│   │   │   ├── runtime/
│   │   │   ├── memory/
│   │   │   ├── gateway/
│   │   │   └── identity/
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── s3/
│   │   └── cloudwatch/
│   └── shared/
│       └── providers.tf
│
├── backend/                          # Python backend
│   ├── src/
│   │   ├── simulator/                # TrackWise Simulator
│   │   │   ├── __init__.py
│   │   │   ├── api.py                # FastAPI routes
│   │   │   ├── models.py             # Pydantic models
│   │   │   ├── events.py             # Event emission
│   │   │   └── database.py           # PostgreSQL/SQLite
│   │   ├── gateway/                  # API Gateway handlers
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── websocket.py
│   │   └── ledger/                   # Decision Ledger
│   │       ├── __init__.py
│   │       ├── models.py
│   │       └── repository.py
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── agents/                           # Strands agents
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── config.py                 # Agent configuration
│   │   ├── models.py                 # Shared Pydantic models
│   │   ├── memory.py                 # AgentCore Memory client
│   │   └── observability.py          # Logging/tracing
│   ├── observer/
│   │   ├── __init__.py
│   │   ├── agent.py                  # Strands Agent definition
│   │   ├── tools.py                  # Custom tools
│   │   └── prompts.py                # System prompts
│   ├── case_understanding/
│   ├── recurring_detector/
│   ├── compliance_guardian/
│   ├── resolution_composer/
│   ├── inquiry_bridge/
│   ├── writeback/
│   ├── memory_curator/
│   ├── csv_pack/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── pyproject.toml
│   └── Dockerfile.agent              # Base agent Dockerfile
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   ├── layout/               # Layout components
│   │   │   ├── timeline/             # Timeline components
│   │   │   ├── network/              # A2A network view
│   │   │   └── memory/               # Memory inspector
│   │   ├── pages/
│   │   │   ├── AgentRoom.tsx
│   │   │   ├── Cases.tsx
│   │   │   ├── Network.tsx
│   │   │   ├── Memory.tsx
│   │   │   ├── Ledger.tsx
│   │   │   └── CSVPack.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useTimeline.ts
│   │   │   └── useLanguage.ts
│   │   ├── stores/
│   │   │   ├── modeStore.ts
│   │   │   └── languageStore.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── brand-colors.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── assets/
│   │       └── galderma-logo.svg
│   ├── scripts/
│   │   └── extract-palette.ts
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
│
├── scripts/
│   ├── reset-demo.sh                 # Reset demo data
│   ├── seed-data.sh                  # Seed patterns
│   └── local-dev.sh                  # Start local stack
│
├── docker-compose.yml                # Local development
├── Makefile                          # Common commands
└── README.md
```

---

## 2. Development Environment

### 2.1 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ | Backend + agents |
| Node.js | 20+ | Frontend |
| Terraform | 1.7+ | Infrastructure |
| AWS CLI | 2.15+ | AWS operations |
| Docker | 24+ | Containerization |
| uv | 0.4+ | Python package manager |
| pnpm | 9+ | Node package manager |

### 2.2 AWS Configuration

```bash
# Configure AWS CLI profile for demo account
aws configure --profile galderma-demo

# Expected configuration:
# AWS Access Key ID: [from account 176545286005]
# AWS Secret Access Key: [from account 176545286005]
# Default region name: us-east-2
# Default output format: json

# Verify access
aws sts get-caller-identity --profile galderma-demo
```

### 2.3 Local Development Setup

```bash
# Clone repository
git clone https://github.com/galderma/demo-trackwise.git
cd demo-trackwise

# Install Python dependencies
cd backend && uv sync && cd ..
cd agents && uv sync && cd ..

# Install Node dependencies
cd frontend && pnpm install && cd ..

# Copy environment templates
cp .env.example .env

# Start local stack
docker-compose up -d

# Initialize database
make db-migrate
make db-seed
```

### 2.4 Environment Variables

```bash
# .env.example
# AWS
AWS_PROFILE=galderma-demo
AWS_REGION=us-east-2
AWS_ACCOUNT_ID=176545286005

# AgentCore
AGENTCORE_MEMORY_RESOURCE=galderma-demo-memory
AGENTCORE_GATEWAY_ENDPOINT=https://gateway.agentcore.us-east-2.amazonaws.com

# LLM
ANTHROPIC_MODEL_OPUS=anthropic.claude-opus-4-5-20251101
ANTHROPIC_MODEL_HAIKU=anthropic.claude-haiku-4-5-20251101

# Database (local dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackwise_demo

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

---

## 3. Tech Stack Details

### 3.1 Backend Stack

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| Runtime | Python | 3.12 | Type hints required |
| Framework | FastAPI | 0.110+ | Async support |
| Validation | Pydantic | 2.x | V2 syntax |
| Database | PostgreSQL | 16 | Via SQLAlchemy |
| Migrations | Alembic | 1.13+ | Auto-generate |
| HTTP Client | httpx | 0.27+ | Async |
| Testing | pytest | 8.x | With pytest-asyncio |

### 3.2 Agent Stack

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| Framework | AWS Strands | Latest | SDK Python |
| Runtime | AgentCore | Latest | Serverless |
| Memory | AgentCore Memory | Latest | STM + LTM |
| Tools | Strands Tools | Latest | Built-in + custom |

### 3.3 Frontend Stack

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| Framework | React | 19 | With Server Components |
| Build Tool | Vite | 6.x | Fast HMR |
| Styling | Tailwind CSS | 4.x | JIT mode |
| State | Zustand | 5.x | Minimal |
| Data Fetching | TanStack Query | 5.x | Caching |
| Charts | Recharts | 2.x | For metrics |
| Graph | react-force-graph | 1.44+ | A2A network |
| Icons | Lucide | Latest | Consistent icons |

### 3.4 Infrastructure Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| IaC | Terraform | NO CloudFormation |
| Auth | Cognito | NO Amplify |
| Compute | AgentCore Runtime | Serverless agents |
| Storage | S3 + DynamoDB | Artifacts + ledger |
| Observability | CloudWatch | Logs + traces + metrics |
| CI/CD | GitHub Actions | Complete pipeline |

---

## 4. Infrastructure (Terraform)

### 4.1 Module Structure

```hcl
# infra/modules/agentcore/runtime/main.tf
resource "aws_agentcore_agent" "agent" {
  name        = var.agent_name
  description = var.description

  runtime_config {
    model_id    = var.model_id
    timeout_ms  = var.timeout_ms
    memory_mb   = var.memory_mb
  }

  a2a_config {
    port = 9000
    path = "/"
    auth = "sigv4"
  }

  memory_resource = var.memory_arn

  observability {
    log_group     = var.log_group
    trace_enabled = true
    metrics_enabled = true
  }

  tags = var.tags
}
```

### 4.2 AgentCore Memory Module

```hcl
# infra/modules/agentcore/memory/main.tf
resource "aws_agentcore_memory" "memory" {
  name = var.memory_name

  strategies = [
    {
      semantic_memory_strategy = {
        name = "RecurringPatterns"
      }
    },
    {
      semantic_memory_strategy = {
        name = "ResolutionTemplates"
      }
    },
    {
      semantic_memory_strategy = {
        name = "PolicyKnowledge"
      }
    }
  ]

  retention_config {
    stm_expiry_days = 90
    ltm_enabled     = true
  }

  tags = var.tags
}
```

### 4.3 Environment Configuration

```hcl
# infra/environments/dev/main.tf
module "agentcore_memory" {
  source      = "../../modules/agentcore/memory"
  memory_name = "galderma-demo-memory-dev"
  tags        = local.tags
}

module "agent_observer" {
  source       = "../../modules/agentcore/runtime"
  agent_name   = "observer-dev"
  description  = "Observer Agent"
  model_id     = "anthropic.claude-haiku-4-5-20251101"
  memory_arn   = module.agentcore_memory.arn
  log_group    = module.cloudwatch.agent_log_group
  tags         = local.tags
}

module "agent_compliance_guardian" {
  source       = "../../modules/agentcore/runtime"
  agent_name   = "compliance-guardian-dev"
  description  = "Compliance Guardian Agent"
  model_id     = "anthropic.claude-opus-4-5-20251101"  # OPUS for critical
  memory_arn   = module.agentcore_memory.arn
  log_group    = module.cloudwatch.agent_log_group
  tags         = local.tags
}
```

### 4.4 Deployment Commands

```bash
# Initialize Terraform
cd infra/environments/dev
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Destroy (careful!)
terraform destroy
```

---

## 5. Backend Implementation

### 5.1 TrackWise Simulator API

```python
# backend/src/simulator/api.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from .models import Case, CaseCreate, Event
from .events import emit_event
from .database import get_db

app = FastAPI(title="TrackWise Simulator")

@app.post("/cases", response_model=Case)
async def create_case(
    case: CaseCreate,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """Create a new case and emit event."""
    created = await db.cases.create(case)

    # Emit event to AgentCore Gateway
    background_tasks.add_task(
        emit_event,
        event_type=f"{case.type}Created",
        payload=created.model_dump()
    )

    return created


@app.patch("/cases/{case_id}", response_model=Case)
async def update_case(
    case_id: str,
    update: CaseUpdate,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """Update case (used by Writeback agent)."""
    existing = await db.cases.get(case_id)
    if not existing:
        raise HTTPException(404, "Case not found")

    updated = await db.cases.update(case_id, update)

    # Emit appropriate event
    if update.status == "CLOSED":
        background_tasks.add_task(
            emit_event,
            event_type=f"{existing.type}Closed",
            payload=updated.model_dump()
        )

    return updated
```

### 5.2 Event Emission

```python
# backend/src/simulator/events.py
import httpx
from .config import settings

async def emit_event(event_type: str, payload: dict):
    """Emit event to AgentCore Gateway."""
    event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "trackwise_simulator",
        "payload": payload
    }

    async with httpx.AsyncClient() as client:
        await client.post(
            f"{settings.AGENTCORE_GATEWAY_URL}/events",
            json=event,
            headers={"Authorization": f"Bearer {settings.gateway_token}"}
        )
```

### 5.3 WebSocket for Live Timeline

```python
# backend/src/gateway/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws/timeline")
async def timeline_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

---

## 6. Agent Implementation

### 6.1 Base Agent Structure

```python
# agents/shared/config.py
from pydantic_settings import BaseSettings

class AgentConfig(BaseSettings):
    agent_name: str
    model_id: str
    memory_resource: str
    log_level: str = "INFO"

    class Config:
        env_prefix = "AGENT_"
```

### 6.2 Observer Agent

```python
# agents/observer/agent.py
from strands import Agent, tool
from strands.models import BedrockModel
from ..shared.config import AgentConfig
from ..shared.models import EventEnvelope

config = AgentConfig()

# Define the agent
observer_agent = Agent(
    name="observer",
    model=BedrockModel(model_id=config.model_id),
    system_prompt="""You are the Observer Agent for the Galderma TrackWise AI Autopilot system.

Your role:
- Receive raw events from the TrackWise Simulator
- Validate event structure and required fields
- Normalize events into standard envelope format
- Route events to the Case Understanding Agent
- Log all events for observability

Rules:
- Never modify the semantic content of events
- Always include original event in envelope for audit
- Flag high-severity cases for priority routing
- Emit structured logs for every event processed
"""
)

@tool
def normalize_event(raw_event: dict) -> EventEnvelope:
    """Normalize raw simulator event into standard envelope."""
    return EventEnvelope(
        envelope_id=str(uuid.uuid4()),
        original_event_id=raw_event["event_id"],
        event_type=raw_event["event_type"],
        timestamp=raw_event["timestamp"],
        source=raw_event["source"],
        payload={
            "case_id": raw_event["payload"]["case_id"],
            "case_type": raw_event["payload"]["type"],
            "raw_data": raw_event["payload"]
        },
        routing={
            "next_agent": "case_understanding",
            "priority": "HIGH" if raw_event["payload"].get("severity") in ["HIGH", "CRITICAL"] else "NORMAL"
        }
    )

# Register tool
observer_agent.register_tool(normalize_event)
```

### 6.3 Compliance Guardian Agent (OPUS)

```python
# agents/compliance_guardian/agent.py
from strands import Agent, tool
from strands.models import BedrockModel
from ..shared.models import PolicyCheckResult

# Note: OPUS model for critical decisions
config = AgentConfig()
assert "opus" in config.model_id.lower(), "Compliance Guardian requires OPUS model"

compliance_guardian = Agent(
    name="compliance_guardian",
    model=BedrockModel(model_id=config.model_id),  # OPUS
    system_prompt="""You are the Compliance Guardian Agent for the Galderma TrackWise AI Autopilot system.

Your role:
- Enforce regulatory compliance policies
- Validate evidence completeness for all actions
- Approve or reject proposed agent actions
- Ensure audit trail requirements are met
- Block non-compliant actions

Rules:
- NEVER approve auto-close for HIGH/CRITICAL severity
- ALWAYS verify required fields before approval
- REQUIRE pattern confidence >= 0.90 for auto-close
- LOG detailed rationale for every decision
- ESCALATE when uncertain - err on side of caution

Policies you enforce:
- POL-001: Required Fields
- POL-002: Severity Escalation
- POL-003: Evidence Completeness
- POL-004: Pattern Confidence
- POL-005: Audit Trail
"""
)

POLICIES = {
    "POL-001": lambda data: all(data.get(f) for f in ["product", "category", "description"]),
    "POL-002": lambda data: data.get("severity") not in ["HIGH", "CRITICAL"],
    "POL-004": lambda data: data.get("confidence", 0) >= 0.90,
}

@tool
def check_policies(case_data: dict, proposed_action: str) -> PolicyCheckResult:
    """Check all compliance policies against proposed action."""
    results = []
    for policy_id, check_fn in POLICIES.items():
        passed = check_fn(case_data)
        results.append({
            "policy_id": policy_id,
            "passed": passed,
            "details": f"Policy {policy_id} {'passed' if passed else 'failed'}"
        })

    all_passed = all(r["passed"] for r in results)
    return PolicyCheckResult(
        overall_status="APPROVED" if all_passed else "REJECTED",
        policy_results=results,
        approved_action=proposed_action if all_passed else None,
        decision_rationale="All policies passed" if all_passed else "One or more policies failed"
    )

compliance_guardian.register_tool(check_policies)
```

### 6.4 Resolution Composer Agent (OPUS)

```python
# agents/resolution_composer/agent.py
from strands import Agent, tool
from strands.models import BedrockModel

resolution_composer = Agent(
    name="resolution_composer",
    model=BedrockModel(model_id="anthropic.claude-opus-4-5-20251101"),  # OPUS
    system_prompt="""You are the Resolution Composer Agent for the Galderma TrackWise AI Autopilot system.

Your role:
- Generate clear, professional resolution summaries
- Create outputs in 4 languages simultaneously (PT/EN/ES/FR)
- Produce detailed audit records with full reasoning
- Ensure consistency across language variants
- Include all relevant evidence references

Rules:
- ALWAYS store canonical (language-neutral) output first
- GENERATE all 4 language variants in parallel
- MAINTAIN semantic consistency across translations
- INCLUDE agent reasoning chain in audit record
- USE professional, regulatory-appropriate language
- NEVER include speculative information

Output quality standards:
- Clear and concise (max 3 sentences for summary)
- Include key identifiers (product, category, case count)
- Reference evidence for traceability
"""
)

@tool
def generate_multilang_output(
    canonical_key: str,
    variables: dict
) -> dict:
    """Generate resolution output in all 4 languages."""
    templates = RESOLUTION_TEMPLATES[canonical_key]

    return {
        "canonical_output": {
            "key": canonical_key,
            "variables": variables
        },
        "rendered_outputs": {
            lang: template.format(**variables)
            for lang, template in templates.items()
        }
    }

resolution_composer.register_tool(generate_multilang_output)
```

### 6.5 A2A Client for Inter-Agent Communication

```python
# agents/shared/a2a_client.py
import httpx
from typing import Any

class A2AClient:
    """Client for A2A protocol communication."""

    def __init__(self, agent_endpoint: str):
        self.endpoint = agent_endpoint
        self.client = httpx.AsyncClient()

    async def send_task(self, task_id: str, message: dict) -> dict:
        """Send task to another agent via A2A protocol."""
        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "tasks/send",
            "params": {
                "id": task_id,
                "message": {
                    "role": "user",
                    "parts": [{"type": "data", "data": message}]
                }
            }
        }

        response = await self.client.post(
            f"{self.endpoint}:9000/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json()

    async def get_task_status(self, task_id: str) -> dict:
        """Get task status from another agent."""
        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "tasks/get",
            "params": {"id": task_id}
        }

        response = await self.client.post(
            f"{self.endpoint}:9000/",
            json=payload
        )
        return response.json()
```

---

## 7. Frontend Implementation

### 7.1 Project Setup

```bash
# Create Vite project
pnpm create vite frontend --template react-ts

# Install dependencies
cd frontend
pnpm add @tanstack/react-query zustand lucide-react framer-motion react-force-graph recharts
pnpm add -D tailwindcss postcss autoprefixer @types/react @types/react-dom
```

### 7.2 Tailwind Configuration

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0A0C',
        'bg-surface': '#0F0F14',
        'bg-elevated': '#16161D',
        'text-primary': '#EAEAF0',
        'text-secondary': '#9CA3AF',
        'accent': 'var(--color-accent, #00A4B4)',
      },
      backdropBlur: {
        glass: '16px',
      },
      borderRadius: {
        panel: '16px',
        button: '8px',
        badge: '6px',
      },
    },
  },
  plugins: [],
};
```

### 7.3 Mode Store (Zustand)

```typescript
// frontend/src/stores/modeStore.ts
import { create } from 'zustand';

type Mode = 'OBSERVE' | 'TRAIN' | 'ACT';

interface ModeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'OBSERVE',
  setMode: (mode) => set({ mode }),
}));
```

### 7.4 Language Store

```typescript
// frontend/src/stores/languageStore.ts
import { create } from 'zustand';

type Language = 'AUTO' | 'PT' | 'EN' | 'ES' | 'FR';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'EN',
  setLanguage: (language) => set({ language }),
}));
```

### 7.5 WebSocket Hook

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url: string, onMessage: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => console.log('WebSocket connected');

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connect, 3000);
    };
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  return ws;
}
```

### 7.6 Timeline Component

```tsx
// frontend/src/components/timeline/Timeline.tsx
import { useWebSocket } from '@/hooks/useWebSocket';
import { useCallback, useState } from 'react';
import { TimelineEvent } from './TimelineEvent';

export function Timeline() {
  const [events, setEvents] = useState<AgentEvent[]>([]);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'agent_event') {
      setEvents((prev) => [data.event, ...prev].slice(0, 100));
    }
  }, []);

  useWebSocket(`${import.meta.env.VITE_WS_URL}/timeline`, handleMessage);

  return (
    <div className="flex flex-col h-full bg-glass-default backdrop-blur-glass rounded-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 text-text-primary">Live Timeline</h2>
        <button className="btn-ghost text-body-sm">Clear</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {events.map((event) => (
          <TimelineEvent key={event.step_id} event={event} />
        ))}
      </div>
    </div>
  );
}
```

---

## 8. API Contracts

### 8.1 REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/cases` | List cases |
| `POST` | `/api/cases` | Create case |
| `GET` | `/api/cases/{id}` | Get case |
| `PATCH` | `/api/cases/{id}` | Update case |
| `GET` | `/api/runs` | List runs |
| `GET` | `/api/runs/{id}` | Get run detail |
| `POST` | `/api/runs/{id}/replay` | Replay run |
| `GET` | `/api/ledger` | List ledger entries |
| `GET` | `/api/ledger/{id}` | Get ledger entry |
| `GET` | `/api/memory` | List memory entries |
| `DELETE` | `/api/memory/{id}` | Delete memory |
| `POST` | `/api/csv-pack/generate` | Generate CSV pack |
| `GET` | `/api/csv-pack` | List packs |

### 8.2 WebSocket Events

| Event Type | Direction | Payload |
|------------|-----------|---------|
| `agent_event` | Server → Client | Agent step data |
| `run_started` | Server → Client | Run metadata |
| `run_completed` | Server → Client | Run result |
| `memory_updated` | Server → Client | Memory change |

### 8.3 A2A JSON-RPC Methods

| Method | Description |
|--------|-------------|
| `tasks/send` | Send task to agent |
| `tasks/get` | Get task status |
| `tasks/cancel` | Cancel task |

---

## 9. CI/CD Pipeline

### 9.1 CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: cd backend && uv sync && uv run ruff check .

  lint-agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: cd agents && uv sync && uv run ruff check .

  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: cd frontend && pnpm install && pnpm run lint

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: cd backend && uv sync && uv run pytest

  test-agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: cd agents && uv sync && uv run pytest

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: cd frontend && pnpm install && pnpm test

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: cd frontend && pnpm install && pnpm build
```

### 9.2 Infrastructure Deployment

```yaml
# .github/workflows/deploy-infra.yml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths: ['infra/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-2

      - name: Terraform Init
        run: terraform init
        working-directory: infra/environments/prod

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: infra/environments/prod

      - name: Terraform Apply
        run: terraform apply -auto-approve tfplan
        working-directory: infra/environments/prod
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Component | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Backend | pytest | 80% |
| Agents | pytest + mocks | 70% |
| Frontend | Vitest | 70% |

### 10.2 Agent Unit Test Example

```python
# agents/tests/unit/test_compliance_guardian.py
import pytest
from unittest.mock import Mock
from compliance_guardian.agent import check_policies

def test_auto_close_blocked_for_high_severity():
    """HIGH severity should block auto-close."""
    case_data = {
        "product": "Cetaphil",
        "category": "Packaging",
        "description": "Broken seal",
        "severity": "HIGH",
        "confidence": 0.95
    }

    result = check_policies(case_data, "AUTO_CLOSE")

    assert result.overall_status == "REJECTED"
    assert any(p["policy_id"] == "POL-002" and not p["passed"]
               for p in result.policy_results)


def test_auto_close_approved_for_valid_case():
    """Valid recurring case should be approved."""
    case_data = {
        "product": "Cetaphil",
        "category": "Packaging",
        "description": "Broken seal",
        "severity": "MEDIUM",
        "confidence": 0.94
    }

    result = check_policies(case_data, "AUTO_CLOSE")

    assert result.overall_status == "APPROVED"
    assert result.approved_action == "AUTO_CLOSE"
```

### 10.3 Integration Tests

```python
# agents/tests/integration/test_agent_flow.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_complaint_flow_observe_mode():
    """Test full complaint flow in OBSERVE mode."""
    async with AsyncClient(base_url="http://localhost:8000") as client:
        # Create complaint
        response = await client.post("/api/cases", json={
            "type": "COMPLAINT",
            "severity": "MEDIUM",
            "product": "Cetaphil",
            "description": "Packaging defect"
        })
        case = response.json()

        # Wait for agents to process
        await asyncio.sleep(5)

        # Get run
        runs = await client.get(f"/api/runs?case_id={case['case_id']}")
        run = runs.json()["data"][0]

        # In OBSERVE mode, case should still be OPEN
        case_after = await client.get(f"/api/cases/{case['case_id']}")
        assert case_after.json()["status"] == "OPEN"

        # But run should show recommendation
        assert run["canonical_output"]["action_taken"] in ["AUTO_CLOSE", "OBSERVE_ONLY"]
```

---

## 11. Implementation Checklist

### Phase 1: Core Wow (4-6 weeks)

#### Week 1-2: Infrastructure + Simulator
- [ ] Terraform modules for AgentCore (Runtime, Memory, Gateway)
- [ ] Cognito user pool
- [ ] DynamoDB tables (runs, ledger)
- [ ] S3 buckets (artifacts)
- [ ] TrackWise Simulator API (FastAPI)
- [ ] PostgreSQL database setup
- [ ] Event emission to Gateway

#### Week 3-4: Core Agents
- [ ] Observer Agent (Strands + Haiku)
- [ ] Case Understanding Agent (Haiku)
- [ ] Resolution Composer Agent (OPUS)
- [ ] A2A communication setup
- [ ] AgentCore Memory integration
- [ ] Basic logging/observability

#### Week 5-6: Frontend MVP
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Brand color extraction script
- [ ] Layout components (TopBar, LeftNav)
- [ ] Agent Room page
- [ ] Live timeline (WebSocket)
- [ ] Language toggle
- [ ] Basic run detail panel

### Phase 2: Full Demo (6-8 weeks)

#### Week 7-8: Remaining Agents
- [ ] Recurring Detector Agent
- [ ] Compliance Guardian Agent (OPUS)
- [ ] Inquiry Bridge Agent
- [ ] Writeback Agent
- [ ] Memory Curator Agent
- [ ] CSV Pack Agent

#### Week 9-10: Agent Room Features
- [ ] Per-run trace view
- [ ] Replay functionality
- [ ] A2A Network visualization
- [ ] Memory Inspector
- [ ] Human feedback interface

#### Week 11-12: Polish + CSV Pack
- [ ] CSV Pack generation (Code Interpreter)
- [ ] Decision Ledger view
- [ ] Burst simulation
- [ ] Mode switching (Observe/Train/Act)
- [ ] Error handling + recovery
- [ ] Demo reset scripts

#### Week 13+: Testing + Documentation
- [ ] Unit test coverage
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Demo script rehearsal
- [ ] Performance optimization

---

## 12. Development Commands

### 12.1 Makefile

```makefile
# Makefile
.PHONY: install dev test lint build deploy

# Install all dependencies
install:
	cd backend && uv sync
	cd agents && uv sync
	cd frontend && pnpm install

# Start local development
dev:
	docker-compose up -d db redis
	cd backend && uv run uvicorn src.main:app --reload &
	cd frontend && pnpm dev

# Run all tests
test:
	cd backend && uv run pytest
	cd agents && uv run pytest
	cd frontend && pnpm test

# Lint all code
lint:
	cd backend && uv run ruff check .
	cd agents && uv run ruff check .
	cd frontend && pnpm lint

# Build for production
build:
	cd frontend && pnpm build
	docker build -t galderma-backend ./backend
	docker build -t galderma-agents ./agents

# Database migrations
db-migrate:
	cd backend && uv run alembic upgrade head

db-seed:
	cd backend && uv run python scripts/seed_data.py

# Reset demo data
reset-demo:
	./scripts/reset-demo.sh

# Deploy infrastructure
deploy-infra:
	cd infra/environments/prod && terraform apply

# Deploy application
deploy-app:
	aws ecr get-login-password | docker login --username AWS --password-stdin $(ECR_URL)
	docker push $(ECR_URL)/galderma-backend:latest
	docker push $(ECR_URL)/galderma-agents:latest
```

### 12.2 Quick Reference

| Task | Command |
|------|---------|
| Start local dev | `make dev` |
| Run all tests | `make test` |
| Lint code | `make lint` |
| Reset demo data | `make reset-demo` |
| Deploy infrastructure | `make deploy-infra` |
| Database migration | `make db-migrate` |
| Seed test data | `make db-seed` |

---

## Related Documents

- [PRD.md](./PRD.md) - Main requirements document
- [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - Agent specifications
- [DATA_MODEL.md](./DATA_MODEL.md) - Data schemas
- [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md) - Design system
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) - Demo walkthrough

---

*Build specification based on AWS Strands SDK patterns, AgentCore deployment guides, and modern Python/React best practices (2026).*
