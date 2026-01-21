# Tech Stack

## Agent Framework & Runtime
- **Framework**: AWS Strands Agents SDK (100% MANDATORY)
- **Runtime**: Amazon Bedrock AgentCore (Runtime, Memory, Gateway, Observability, Identity)
- **A2A Protocol**: JSON-RPC 2.0 on port 9000, SigV4 + OAuth 2.0 auth

## LLM Policy
- **Critical agents**: Claude 4.5 OPUS (Compliance Guardian, Resolution Composer)
- **Operational agents**: Claude 4.5 Haiku (Observer, Case Understanding, Recurring Detector, Inquiry Bridge, Writeback, Memory Curator, CSV Pack)

## Backend
| Component | Technology | Notes |
|-----------|------------|-------|
| Runtime | Python 3.12+ | Type hints required |
| Framework | FastAPI 0.110+ | Async support |
| Validation | Pydantic 2.x | V2 syntax |
| Database | PostgreSQL 16 | Via SQLAlchemy |
| Migrations | Alembic 1.13+ | Auto-generate |
| HTTP Client | httpx 0.27+ | Async |
| Testing | pytest 8.x | With pytest-asyncio |
| Package Manager | uv | NOT pip or poetry |

## Frontend
| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | React 19 | With Server Components |
| Build Tool | Vite 6.x | Fast HMR |
| Styling | Tailwind CSS 4.x | JIT mode |
| State | Zustand 5.x | Minimal |
| Data Fetching | TanStack Query 5.x | Caching |
| Charts | Recharts 2.x | For metrics |
| Graph | react-force-graph 1.44+ | A2A network |
| Icons | Lucide | Consistent icons |
| Package Manager | pnpm | NOT npm or yarn |

## Infrastructure (MANDATORY RULES)
| Component | Technology | Notes |
|-----------|------------|-------|
| IaC | **Terraform ONLY** | NO CloudFormation/SAM |
| Auth | **Amazon Cognito** | NO Amplify |
| Region | **us-east-2** | AWS Account 176545286005 |
| CI/CD | **GitHub Actions** | Complete pipeline |

## Key References
- Strands: https://strandsagents.com/latest/
- AgentCore: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/
- A2A Protocol: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-a2a-protocol-contract.html
