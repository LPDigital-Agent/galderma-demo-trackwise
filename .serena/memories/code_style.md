# Code Style and Conventions

## Python (Backend + Agents)
- **Python 3.12+** required
- **Type hints REQUIRED** for all function signatures
- **Pydantic V2** for data validation
- **Async/await** patterns for I/O
- **Ruff** for linting and formatting
- Follow **PEP 8** naming conventions:
  - `snake_case` for functions and variables
  - `PascalCase` for classes
  - `UPPER_CASE` for constants

## TypeScript/React (Frontend)
- **TypeScript strict mode** enabled
- **React 19** with functional components and hooks
- **Tailwind CSS** for styling (dark glassmorphism theme)
- **ESLint** for linting
- Use **named exports** for components
- Follow **camelCase** for variables and functions
- Follow **PascalCase** for components and types

## Sandwich Pattern (MANDATORY)
```
CODE → LLM → CODE
```
- **Code (Prepare)**: HTTP requests, JSON parsing, auth, normalization
- **LLM (Reason)**: Intent extraction, classification, decision logic, text generation
- **Code (Validate)**: Schema check, type coercion, error handling, persistence

## Agent Prompt Language
- ALL agent system prompts MUST be in **ENGLISH**
- UI messages may be **pt-BR** for Brazilian users

## Git Conventions
- Feature branches: `feature/<description>`
- Bug fixes: `fix/<description>`
- Hotfixes: `hotfix/<description>`
- Conventional commits preferred

## Design System (UI)
- **Dark Glassmorphism** theme
- `backdrop-filter: blur(16px)`
- `background: rgba(15, 15, 20, 0.55)`
- `border-radius: 16px` (panels) or `24px` (cards)
- Colors: `bg-base: #0A0A0C`, `text-primary: #EAEAF0`
- Auto-extract accent colors from Galderma logo
