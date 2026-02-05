# Frontend — React Agent Room UI

## Purpose
Real-time dashboard showing the 9-agent mesh in action. Dark glassmorphism design system optimized for sales demo impact.

## Stack
- **Framework:** React 18 + TypeScript strict mode
- **Build:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query (server) + useState/useReducer (local)
- **Forms:** react-hook-form + zod
- **Package manager:** pnpm

## Key Paths
- `src/App.tsx` — Root component
- `src/components/` — Reusable UI components (shadcn/ui based)
- `src/pages/` — Route-level page components
- `src/hooks/` — Custom React hooks
- `src/api/` — API client (TanStack Query queries/mutations)
- `src/types/` — TypeScript type definitions
- `public/` — Static assets

## Commands
```bash
pnpm dev          # dev server (http://localhost:5173)
pnpm build        # production build
pnpm test         # vitest
pnpm lint         # eslint
```

## Design System
- See @docs/prd/UI_DESIGN_SYSTEM.md for tokens, colors, glassmorphism specs
- Dark theme ONLY (demo requirement)
- WebSocket connection for real-time agent activity feed
- A2A protocol events rendered as timeline cards

## Rules
- Functional components only, no class components
- ES modules (import/export), never CommonJS
- All form inputs must have proper aria-* attributes
- Optimistic updates for user interactions
- Never use Redux — TanStack Query + local state only
