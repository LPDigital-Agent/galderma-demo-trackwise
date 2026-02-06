# Work Log

Automatically maintained by Claude Code hooks.

---

## 2026-02-06: Apple Liquid Glass UI Transformation

**Commit:** `772abca` — `✨ feat(frontend): Transform UI to Apple Liquid Glass design language`

**Changes (29 files, 349 insertions, 220 deletions):**
- **CSS foundation** (`index.css`): Updated 17 CSS variables (translucent backgrounds, luminous white borders, softer text), added 3 specular highlight variables, updated 10 OKLCH tokens with alpha channels, replaced body gradient with 5-layer rich wallpaper, overhauled `.glass`/`.glass-surface`/`.glass-elevated` utilities with `::before` specular highlights + inner glow + `blur(40-48px)`, added `.glass-sidebar` utility
- **GlassPanel + MetricCard**: Switched to CSS utility classes (specular highlights now automatic), icon squircle
- **Layout**: Sidebar solid `#236B75` → translucent `rgba(35,107,117,0.55)` with `blur(48px)`, glass CommandPalette, pill-shaped StatusBar toggles, glass overlays (CreateCaseModal, AuditorView)
- **Badges**: All solid pastels (`bg-{color}-50`) → translucent glass (`bg-{color}-500/10 backdrop-blur-sm`) across StatusBadge, SeverityBadge, AgentBadge, and inline page badges
- **shadcn/ui**: Glass treatment on card, dialog, sheet, button, table, tabs, badge, select, input, skeleton (10 files)
- **Pages**: All 7 pages updated — glass tables, skeletons (`bg-white/15`), confidence bars, Network React Flow (teal-tinted edges, glass AgentNodes, blurred controls/minimap)

**Execution:** 4-agent parallel team (css-foundation → layout-updater + primitives-updater + pages-updater)

**Verification:** `pnpm build` clean, `pnpm lint` 0 errors (13 pre-existing warnings)

---

## 2026-02-06: AgentCore Runtime Entrypoint Fix

**Commit:** `ab89304` — `🐛 fix(deploy): Rewrite agent packaging to include main.py entry point, shared lib, and ARM64 deps`

**Changes (1 file, ~550 lines rewritten):**
- Complete rewrite of `.github/workflows/deploy-agents.yml` packaging logic
- Each agent ZIP now includes: `main.py` (BedrockAgentCoreApp entry point), agent code as Python package, `shared/` library, ARM64 dependencies
- Simulator ZIP includes: `main.py` wrapper, `src/` FastAPI app, ARM64 dependencies
- Added `module_name` and `is_simulator` matrix fields for correct import paths
- ZIP sizes went from ~4KB (broken) to ~25MB (correct)

**Root Cause:** Previous workflow zipped only agent source files without the entry point, shared library, or ARM64-compiled dependencies that AgentCore requires.

**Verification:** GH Actions run `21735590108` — all 10 S3 uploads + Terraform apply succeeded.

---

## 2026-02-05: CORS Fix, Lambda Proxy Routes, Invocations Dispatcher

**Commit:** `150f04f` — `🐛 fix: Resolve CORS duplication, add missing Lambda proxy routes, and complete invocations dispatcher`

**Changes:**
- Fixed duplicate CORS middleware in FastAPI backend
- Added missing Lambda proxy routes for all API endpoints
- Completed invocations dispatcher for AgentCore Runtime

---

## 2026-02-05: Galderma Corporate Light Theme

**Commit:** `d7f42ed` — `🎨 feat(frontend): Transform dark theme to Galderma corporate light theme`

**Changes:**
- Migrated from dark glassmorphism to Galderma corporate light theme
- Updated CSS custom properties, OKLCH tokens, badge colors, opacity inversions
- Fixed React Flow canvas colors (edges, grid, minimap) for light background

---

## 2026-02-05: Dark Cyan Sidebar + Logo Fix

**Commits:** `3ccb448`, `ae42a6c`

- Added dark cyan sidebar (#236B75) with white text for Galderma branding
- Widened Galderma SVG wordmark viewBox to prevent text clipping

---

## 2026-02-05: AgentCore Memory CLI Fix

**Commit:** `454ed43` — `🐛 fix(ci): Use correct AgentCore CLI for memory setup`

Fixed the deploy-infra workflow to use the correct AgentCore CLI command for memory namespace creation.

---

## 2026-02-05: Galderma Demo Scenario + Memory API + CSV Pack

**Commit:** `7302397` — `✨ feat: Add Galderma demo scenario, live Memory API, and CSV Pack enhancements`

**Changes:**
- Added pre-built "Cenário Galderma" demo scenario with deterministic data
- Connected Memory page to live AgentCore Memory API
- Enhanced CSV Pack with 6 compliance artifact types

---

## 2026-02-05: PT-BR Translation + Galderma Brand Identity

**Commit:** `f1514ca` — `🌐 feat: Full PT-BR translation and Galderma brand identity`

**Changes (26 files, +1190/-609):**
- Created i18n infrastructure (`src/i18n/pt-br.ts` ~608 lines + barrel export)
- Applied Galderma corporate palette (teal #4A98B8, blue #3860BE, green #3C7356)
- Updated fonts: Georgia/serif headings, Segoe UI/sans-serif body
- Translated all 17 frontend components, 7 pages, and 2 overlays to PT-BR
- Translated backend demo data (agent names, ledger entries, CSV artifacts)
- Added Galderma SVG wordmark logo to sidebar
- Set HTML lang="pt-BR", updated meta description and theme colors

**Verification:** Backend ruff+pytest PASS, Frontend tsc+vite+eslint+vitest PASS

---

## 2026-02-05: Neo-Cyberpunk UI Rebuild

**Commit:** `ec5e22f` — `🎨 feat(frontend): Complete Neo-Cyberpunk dark UI rebuild from scratch`

Full frontend rebuild with shadcn/ui, React Flow, Motion v12, cmdk command palette.

---

## 2026-01-21: CI/CD Pipeline + Infrastructure

**Commits:** `7ff5293`, `1bf6509`, `2e18ee9`, `bb9e29f`

Fixed deploy race conditions, lint errors, AgentCore UPDATE_FAILED recovery, removed redundant endpoints.

---

## 2026-02-06: Floating Panel Architecture for Liquid Glass UI

**Commit:** `4c04e93` — `✨ feat(frontend): Implement floating panel architecture for full Liquid Glass UI`

**Changes:**
- Converted fixed sidebar/statusbar to floating glass panels over wallpaper background
- Sidebar: translucent floating panel with rounded corners, detached from viewport edges
- StatusBar: floating bottom bar with glass treatment
- Updated sidebarStore with persist middleware for collapsed state
- Button component updated with Liquid Glass gradient variants
- CommandPalette glass overlay refinements
- CSS index.css updates for floating panel positioning and glass utilities

---

## 2026-02-06: Auto-populate Demo Data on AgentCore Cold Start

**Commit:** `ed598fa` — `🐛 fix(backend): Auto-populate demo data on AgentCore cold start`

**Changes (3 files):**
- **`backend/src/main.py`**: Added 4-line guard clause at top of `invocations()` handler to auto-populate Galderma demo scenario when `_cases` dict is empty on cold start
- **`frontend/public/assets/galderma-logo.svg`**: Widened viewBox from `240` to `300` to prevent "GALDERMA" text clipping
- **`frontend/src/components/layout/Sidebar.tsx`**: Removed `overflow-hidden` from logo container

**Root Cause:** AgentCore Runtime uses `@agentcore_app.entrypoint` handler pattern (like Lambda) — it never starts the ASGI server, so FastAPI's `lifespan()` context manager never executes. Demo data population lived exclusively in `lifespan()`, leaving `simulator_api._cases` permanently empty on deployed containers.

**Verification:** All 13 backend tests pass. Deployed via GH Actions to production.

---

## 2026-02-06: Fix API Base URL for Production

**Commit:** `15c3a90` — `🐛 fix(frontend): Append /api prefix to production API base URL`

**Changes (1 file):**
- **`frontend/src/api/client.ts`**: Fixed production API URL construction to append `/api` prefix. Lambda proxy routes all expect `/api/` prefixed paths, but the frontend was hitting the root path directly, causing 404 errors.

**Root Cause:** `VITE_API_URL` env var contains the Lambda Function URL without `/api` suffix. The frontend's axios client used this as-is, resulting in requests to `/cases` instead of `/api/cases`.

**Verification:** All API calls return 200 OK after deployment.

---

## Turn Log — 2026-02-06 03:25:20 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 05:01:46 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 05:16:02 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 05:16:58 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 13:27:57 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 13:37:50 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 13:38:49 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

## Turn Log — 2026-02-06 13:42:30 UTC

**User:** (no user message captured)

**Assistant:** (no assistant response captured)

---

