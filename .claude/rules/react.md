---
paths:
  - "**/frontend/**"
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/client/**"
---

# React / Frontend Rules (Galderma TrackWise)

## Stack
- React 18+ functional components only
- Vite build, pnpm package manager
- TypeScript strict mode

## State
- TanStack Query for server state
- useState/useReducer for local state
- No Redux unless explicitly approved

## Styling
- Tailwind CSS + shadcn/ui only
- Dark glassmorphism (per UI_DESIGN_SYSTEM.md)
- No inline styles or CSS modules

## Quality
- ES modules only, never CommonJS
- react-hook-form + zod for form validation
- All inputs must have aria-* attributes
- Optimistic updates for user interactions
