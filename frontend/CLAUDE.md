# Frontend — React Agent Room UI

## Purpose
Real-time dashboard showing the 9-agent mesh in action. Galderma corporate brand theme (dark) with PT-BR localization, optimized for sales demo impact.

## Stack
- **Framework:** React 19 + TypeScript strict mode
- **Build:** Vite 6
- **Styling:** Tailwind CSS v4 + shadcn/ui (New York style, 20 components)
- **State:** TanStack Query v5 (server) + Zustand v5 (global) + useState (local)
- **Graph:** @xyflow/react v12 (React Flow) for Network visualization
- **Animations:** Motion v12 (FadeIn, PageTransition, StaggerContainer)
- **Command Palette:** cmdk (Cmd+K)
- **Toasts:** sonner
- **Icons:** lucide-react
- **Fonts:** Georgia/serif (headings) + Segoe UI/sans-serif (body) + Geist Mono (code)
- **i18n:** PT-BR via `src/i18n/pt-br.ts` constants map (no framework)
- **Package manager:** pnpm 9+

## Key Paths
- `src/App.tsx` — Router (7 routes under AppLayout)
- `src/components/layout/` — Sidebar, StatusBar, CommandPalette, AppLayout
- `src/components/domain/` — AgentBadge, SeverityBadge, StatusBadge, MetricCard, TimelineItem, GlassPanel, ModeToggle, LanguageSelector, EmptyState
- `src/components/overlays/` — AuditorView (Sheet), CreateCaseModal (Dialog)
- `src/components/motion/` — FadeIn, PageTransition, StaggerContainer
- `src/components/ui/` — 20 shadcn/ui primitives (lowercase filenames!)
- `src/pages/` — AgentRoom, Cases, CaseDetail, Network, Memory, Ledger, CSVPack
- `src/hooks/` — useCases, useCaseDetail, useStats, useWebSocket, useRealtimeSync
- `src/stores/` — modeStore, languageStore, timelineStore
- `src/api/` — API client (axios)
- `src/types/` — TypeScript types + AGENTS constant
- `src/i18n/` — PT-BR translation constants (pt-br.ts + index.ts barrel)

## Commands
```bash
pnpm dev          # dev server (http://localhost:5173)
pnpm build        # production build (includes tsc -b)
pnpm test         # vitest
pnpm lint         # eslint
```

## Design System
- Galderma corporate dark theme: `#080B10` base, glass surfaces, teal/blue accents
- Brand colors: Primary teal `#4A98B8`, Secondary blue `#3860BE`, Accent `#6AAAE4`
- CSS variables in `src/index.css` (--bg-base, --bg-surface, --glass-bg, etc.)
- Dark theme ONLY (demo requirement)
- All UI strings in PT-BR via centralized i18n constants
- Galderma logo SVG wordmark in sidebar (`public/assets/galderma-logo.svg`)
- WebSocket connection for real-time agent activity feed

## Rules
- Functional components only, no class components
- ES modules (import/export), never CommonJS
- All form inputs must have proper aria-* attributes
- Never use Redux — TanStack Query + Zustand only
- shadcn/ui component filenames MUST be lowercase (badge.tsx not Badge.tsx) — Linux CI is case-sensitive
- React Flow custom nodes MUST include Handle components for edges to render
