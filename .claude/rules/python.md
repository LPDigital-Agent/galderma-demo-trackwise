---
paths:
  - "**/*.py"
  - "**/backend/**"
  - "**/agents/**"
  - "**/scripts/*.py"
---

# Python Rules (Galderma TrackWise)

## Type System
- Type hints obrigatórias em todos os parâmetros e retornos
- `from __future__ import annotations` for forward refs
- Pydantic BaseModel over raw dicts for data contracts

## Code Patterns
- Async by default for I/O (httpx, DB, AgentCore)
- `pathlib.Path` over `os.path`
- `logging` module, never `print()` in production
- Structured exceptions, never bare `except:`
- Imports: absolute, sorted, grouped (stdlib > third-party > local)

## Strands Agents
- @tool decorator with typed params + Google style docstrings
- Structured output (Pydantic) for agent responses
- System prompts in English, UI in pt-BR

## Quality
- pytest with fixtures + parametrize
- Mock external services in unit tests
- ruff check + ruff format (not black/isort)
- Target: Python 3.12+ syntax
