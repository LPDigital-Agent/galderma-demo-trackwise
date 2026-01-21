# UI Design System Specification

> **Version**: 1.0
> **Last Updated**: January 2026
> **Parent Document**: [PRD.md](./PRD.md)
> **Design Language**: Dark Glassmorphism (Apple TV / tvOS inspired)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Glassmorphism Specifications](#5-glassmorphism-specifications)
6. [Component Library](#6-component-library)
7. [Page Layouts](#7-page-layouts)
8. [Animation & Motion](#8-animation--motion)
9. [Accessibility](#9-accessibility)
10. [Implementation Guide](#10-implementation-guide)

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Minimalist** | Clean typography, generous whitespace, light text on dark surfaces |
| **Frosted Glass** | Translucent blurred surfaces creating depth and hierarchy |
| **High Contrast** | Ensure readability with clear foreground/background separation |
| **Motion Intentional** | Gentle, meaningful transitions that convey state changes |
| **Desktop-First** | Optimized for large screens (1920x1080+) and presentations |

### 1.2 Design Inspiration

The UI draws inspiration from:
- **Apple TV / tvOS**: Frosted glass panels, subtle shadows, content-first
- **Linear App**: Clean sidebar navigation, card-based content
- **Vercel Dashboard**: Real-time updates, dark theme, data visualization

### 1.3 Target Environment

| Aspect | Specification |
|--------|---------------|
| Platform | Desktop browsers only |
| Min Resolution | 1280x720 |
| Optimal Resolution | 1920x1080 |
| Presentation Mode | 4K / projector compatible |
| Browser Support | Chrome 120+, Edge 120+, Safari 17+, Firefox 120+ |

---

## 2. Color System

### 2.1 Base Palette (Dark Theme)

```css
:root {
  /* Background Layers */
  --color-bg-base: #0A0A0C;           /* Deepest background */
  --color-bg-surface: #0F0F14;        /* Card/panel background */
  --color-bg-elevated: #16161D;       /* Elevated elements */
  --color-bg-overlay: rgba(15, 15, 20, 0.55); /* Glass panels */

  /* Text Colors */
  --color-text-primary: #EAEAF0;      /* Primary text */
  --color-text-secondary: #9CA3AF;    /* Secondary/muted text */
  --color-text-tertiary: #6B7280;     /* Disabled/placeholder */
  --color-text-inverse: #0A0A0C;      /* Text on light backgrounds */

  /* Border Colors */
  --color-border-default: rgba(255, 255, 255, 0.08);
  --color-border-subtle: rgba(255, 255, 255, 0.04);
  --color-border-strong: rgba(255, 255, 255, 0.16);

  /* Status Colors */
  --color-success: #22C55E;
  --color-success-muted: rgba(34, 197, 94, 0.15);
  --color-warning: #F59E0B;
  --color-warning-muted: rgba(245, 158, 11, 0.15);
  --color-error: #EF4444;
  --color-error-muted: rgba(239, 68, 68, 0.15);
  --color-info: #3B82F6;
  --color-info-muted: rgba(59, 130, 246, 0.15);
}
```

### 2.2 Galderma Brand Colors (Auto-Extracted)

The primary accent colors are **auto-extracted from the Galderma logo at build time**.

**Expected Extraction Results**:

```css
:root {
  /* Primary Brand (extracted from Galderma logo) */
  --color-brand-primary: #00A4B4;     /* Teal/Cyan */
  --color-brand-secondary: #003C71;   /* Deep Navy */

  /* Derived Accent Variants */
  --color-accent: #00A4B4;
  --color-accent-hover: #00B8C9;
  --color-accent-active: #0090A0;
  --color-accent-muted: rgba(0, 164, 180, 0.15);

  /* Gradient */
  --gradient-brand: linear-gradient(135deg, #00A4B4 0%, #003C71 100%);
  --gradient-brand-subtle: linear-gradient(135deg, rgba(0, 164, 180, 0.2) 0%, rgba(0, 60, 113, 0.2) 100%);
}
```

### 2.3 Build-Time Palette Extraction

**Implementation** (using `colorthief` or similar):

```javascript
// scripts/extract-palette.js
import ColorThief from 'colorthief';
import fs from 'fs';

const extractPalette = async () => {
  const img = await loadImage('./assets/galderma-logo.svg');
  const colorThief = new ColorThief();

  // Get dominant color
  const dominant = colorThief.getColor(img);

  // Get palette (5 colors)
  const palette = colorThief.getPalette(img, 5);

  // Generate CSS variables
  const cssVars = `
    :root {
      --color-brand-primary: rgb(${dominant.join(',')});
      --color-brand-secondary: rgb(${palette[1].join(',')});
      /* ... additional variants */
    }
  `;

  fs.writeFileSync('./src/styles/brand-colors.css', cssVars);
};
```

### 2.4 Mode Indicator Colors

| Mode | Color | Hex | Usage |
|------|-------|-----|-------|
| Observe | Neutral Gray | `#9CA3AF` | Low-impact, monitoring |
| Train | Amber/Yellow | `#F59E0B` | Learning, attention |
| Act | Teal (Brand) | `#00A4B4` | Active, executing |

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  /* Primary Font (Inter for UI) */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Monospace (for code, IDs, timestamps) */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
}
```

### 3.2 Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `display` | 48px | 1.1 | 700 | Hero titles |
| `h1` | 32px | 1.2 | 600 | Page titles |
| `h2` | 24px | 1.3 | 600 | Section titles |
| `h3` | 20px | 1.4 | 600 | Card titles |
| `h4` | 16px | 1.5 | 600 | Subsection titles |
| `body-lg` | 16px | 1.6 | 400 | Primary content |
| `body` | 14px | 1.6 | 400 | Default text |
| `body-sm` | 12px | 1.5 | 400 | Secondary text |
| `caption` | 11px | 1.4 | 500 | Labels, badges |
| `mono` | 13px | 1.5 | 400 | IDs, code |

### 3.3 Tailwind Typography Classes

```css
/* Typography Utility Classes */
.text-display { @apply text-5xl font-bold leading-tight; }
.text-h1 { @apply text-3xl font-semibold leading-snug; }
.text-h2 { @apply text-2xl font-semibold leading-snug; }
.text-h3 { @apply text-xl font-semibold leading-normal; }
.text-h4 { @apply text-base font-semibold leading-normal; }
.text-body-lg { @apply text-base leading-relaxed; }
.text-body { @apply text-sm leading-relaxed; }
.text-body-sm { @apply text-xs leading-normal; }
.text-caption { @apply text-[11px] font-medium leading-snug; }
.text-mono { @apply font-mono text-[13px] leading-normal; }
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Tight inline spacing |
| `space-2` | 8px | Icon gaps, tight padding |
| `space-3` | 12px | Button padding, small gaps |
| `space-4` | 16px | Card padding, standard gaps |
| `space-5` | 20px | Section padding |
| `space-6` | 24px | Large gaps |
| `space-8` | 32px | Section spacing |
| `space-10` | 40px | Page sections |
| `space-12` | 48px | Major sections |
| `space-16` | 64px | Page margins |

### 4.2 Layout Grid

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR (56px height, fixed)                                   │
├─────────┬───────────────────────────────────────────────────────┤
│         │                                                       │
│  LEFT   │                    MAIN CONTENT                       │
│  NAV    │                                                       │
│         │                    (flex-1, scrollable)               │
│  (240px)│                                                       │
│  fixed  │                                                       │
│         │                                                       │
│         │───────────────────────────────────────────────────────│
│         │                    RIGHT PANEL (optional)             │
│         │                    (400px, collapsible)               │
└─────────┴───────────────────────────────────────────────────────┘
```

### 4.3 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `lg` | 1280px | Minimum supported |
| `xl` | 1440px | Standard desktop |
| `2xl` | 1920px | Large desktop / presentation |

---

## 5. Glassmorphism Specifications

### 5.1 Glass Panel Base

```css
.glass-panel {
  /* Background with translucency */
  background: rgba(15, 15, 20, 0.55);

  /* Blur effect */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  /* Border */
  border: 1px solid rgba(255, 255, 255, 0.08);

  /* Rounded corners */
  border-radius: 16px;

  /* Shadow for depth */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -2px rgba(0, 0, 0, 0.2);
}

/* Accessibility fallback */
@supports not (backdrop-filter: blur(16px)) {
  .glass-panel {
    background: rgba(15, 15, 20, 0.92);
  }
}
```

### 5.2 Glass Variants

| Variant | Background | Blur | Border | Usage |
|---------|------------|------|--------|-------|
| `glass-subtle` | `rgba(15,15,20,0.35)` | 12px | 0.04 | Hover overlays |
| `glass-default` | `rgba(15,15,20,0.55)` | 16px | 0.08 | Cards, panels |
| `glass-strong` | `rgba(15,15,20,0.75)` | 20px | 0.12 | Modals, dropdowns |
| `glass-solid` | `rgba(15,15,20,0.92)` | 24px | 0.16 | Critical actions |

### 5.3 Tailwind Implementation

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      backgroundColor: {
        'glass-subtle': 'rgba(15, 15, 20, 0.35)',
        'glass-default': 'rgba(15, 15, 20, 0.55)',
        'glass-strong': 'rgba(15, 15, 20, 0.75)',
        'glass-solid': 'rgba(15, 15, 20, 0.92)',
      },
      borderRadius: {
        'panel': '16px',
        'panel-lg': '24px',
        'button': '8px',
        'badge': '6px',
      },
    },
  },
};
```

---

## 6. Component Library

### 6.1 Glass Card

```tsx
// components/ui/GlassCard.tsx
interface GlassCardProps {
  variant?: 'subtle' | 'default' | 'strong' | 'solid';
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = ({ variant = 'default', children, className }: GlassCardProps) => (
  <div className={cn(
    'rounded-panel border border-white/8',
    'backdrop-blur-lg',
    {
      'bg-glass-subtle': variant === 'subtle',
      'bg-glass-default': variant === 'default',
      'bg-glass-strong': variant === 'strong',
      'bg-glass-solid': variant === 'solid',
    },
    className
  )}>
    {children}
  </div>
);
```

### 6.2 Button Variants

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| `primary` | `var(--color-accent)` | White | None | Primary actions |
| `secondary` | `transparent` | `var(--color-text-primary)` | `var(--color-border-default)` | Secondary actions |
| `ghost` | `transparent` | `var(--color-text-secondary)` | None | Tertiary actions |
| `danger` | `var(--color-error)` | White | None | Destructive actions |

```css
/* Button Base */
.btn {
  @apply inline-flex items-center justify-center;
  @apply px-4 py-2 rounded-button;
  @apply text-sm font-medium;
  @apply transition-all duration-150;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base;
}

.btn-primary {
  @apply bg-accent text-white;
  @apply hover:bg-accent-hover active:bg-accent-active;
  @apply focus:ring-accent;
}

.btn-secondary {
  @apply bg-transparent text-text-primary border border-border-default;
  @apply hover:bg-white/5 active:bg-white/10;
  @apply focus:ring-white/50;
}

.btn-ghost {
  @apply bg-transparent text-text-secondary;
  @apply hover:text-text-primary hover:bg-white/5;
}
```

### 6.3 Mode Indicator Badge

```tsx
// components/ui/ModeBadge.tsx
const modeConfig = {
  OBSERVE: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-500/15', label: 'Observe' },
  TRAIN: { icon: GraduationCap, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Train' },
  ACT: { icon: Zap, color: 'text-teal-400', bg: 'bg-teal-500/15', label: 'Act' },
};

export const ModeBadge = ({ mode }: { mode: 'OBSERVE' | 'TRAIN' | 'ACT' }) => {
  const config = modeConfig[mode];
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-badge', config.bg)}>
      <config.icon className={cn('w-3.5 h-3.5', config.color)} />
      <span className={cn('text-caption', config.color)}>{config.label}</span>
    </div>
  );
};
```

### 6.4 Language Toggle

```tsx
// components/ui/LanguageToggle.tsx
const languages = [
  { code: 'AUTO', label: 'Auto' },
  { code: 'PT', label: 'PT' },
  { code: 'EN', label: 'EN' },
  { code: 'ES', label: 'ES' },
  { code: 'FR', label: 'FR' },
];

export const LanguageToggle = ({ value, onChange }) => (
  <div className="inline-flex bg-glass-subtle rounded-button p-0.5">
    {languages.map((lang) => (
      <button
        key={lang.code}
        onClick={() => onChange(lang.code)}
        className={cn(
          'px-3 py-1.5 text-caption rounded-badge transition-all',
          value === lang.code
            ? 'bg-accent text-white'
            : 'text-text-secondary hover:text-text-primary'
        )}
      >
        {lang.label}
      </button>
    ))}
  </div>
);
```

### 6.5 Timeline Event

```tsx
// components/timeline/TimelineEvent.tsx
export const TimelineEvent = ({ event }) => (
  <div className="flex gap-3 py-3 px-4 hover:bg-white/3 rounded-lg transition-colors">
    {/* Timestamp */}
    <div className="w-20 flex-shrink-0">
      <span className="text-mono text-text-tertiary">
        {format(event.timestamp, 'HH:mm:ss')}
      </span>
    </div>

    {/* Agent Badge */}
    <div className="w-32 flex-shrink-0">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent/15 text-accent text-caption rounded-badge">
        <Bot className="w-3 h-3" />
        {event.agent_name}
      </span>
    </div>

    {/* Action */}
    <div className="flex-1">
      <p className="text-body text-text-primary">{event.action}</p>
      {event.reasoning && (
        <p className="text-body-sm text-text-secondary mt-1">{event.reasoning}</p>
      )}
    </div>

    {/* Metrics */}
    <div className="w-24 text-right flex-shrink-0">
      <span className="text-mono text-text-tertiary">{event.duration_ms}ms</span>
    </div>
  </div>
);
```

### 6.6 Severity Badge

| Severity | Background | Text | Icon |
|----------|------------|------|------|
| LOW | `rgba(34, 197, 94, 0.15)` | `#22C55E` | CheckCircle |
| MEDIUM | `rgba(59, 130, 246, 0.15)` | `#3B82F6` | Info |
| HIGH | `rgba(245, 158, 11, 0.15)` | `#F59E0B` | AlertTriangle |
| CRITICAL | `rgba(239, 68, 68, 0.15)` | `#EF4444` | AlertOctagon |

---

## 7. Page Layouts

### 7.1 Top Bar

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo]  GALDERMA TrackWise AI Autopilot    │ DEMO │ [Mode] │ [Lang] [User] │
└─────────────────────────────────────────────────────────────────────────┘
```

**Components**:
- Galderma logo (left, auto-extracted colors)
- Product title
- Environment badge: "DEMO / SIMULATED DATA" (amber background)
- Mode switch: Observe | Train | Act (toggle group)
- Language toggle: Auto | PT | EN | ES | FR
- User avatar/role badge

### 7.2 Left Navigation

```
┌────────────────────┐
│  Agent Room        │  ← Default landing
│  Cases             │
│  A2A Network       │
│  Memory            │
│  Ledger            │
│  CSV Pack          │
├────────────────────┤
│  ─────────────     │
│  Simulate Burst    │  ← Action button
│  Settings          │
└────────────────────┘
```

### 7.3 Agent Room Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                  │
├─────────┬───────────────────────────────────────────┬───────────────────┤
│         │                                           │                   │
│ LEFT    │         LIVE TIMELINE (CENTER)            │   RUN DETAILS     │
│ NAV     │                                           │   (RIGHT PANEL)   │
│         │  ┌─────────────────────────────────────┐  │                   │
│         │  │ 10:30:00  Observer    normalize...  │  │  Run ID: run-123  │
│         │  │ 10:30:00  CaseUnder   extract...    │  │  Mode: ACT        │
│         │  │ 10:30:01  Recurring   pattern...    │  │  Status: RUNNING  │
│         │  │ 10:30:01  Guardian    policy...     │  │                   │
│         │  │ 10:30:02  Composer    generate...   │  │  ─────────────    │
│         │  │ 10:30:02  Writeback   execute...    │  │                   │
│         │  └─────────────────────────────────────┘  │  Outputs [PT|EN]  │
│         │                                           │  Audit Trail      │
│         │  [ Auto-scroll: ON ]  [ Clear ]          │  Agent Steps      │
│         │                                           │                   │
└─────────┴───────────────────────────────────────────┴───────────────────┘
```

### 7.4 A2A Network View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                  │
├─────────┬───────────────────────────────────────────────────────────────┤
│         │                                                               │
│ LEFT    │                  NETWORK GRAPH                                │
│ NAV     │                                                               │
│         │         ┌──────┐        ┌──────┐                             │
│         │         │ OBS  │───────▶│ CASE │                             │
│         │         └──────┘        └──────┘                             │
│         │                            │                                  │
│         │                    ┌───────┴───────┐                         │
│         │                    ▼               ▼                         │
│         │               ┌──────┐        ┌──────┐                       │
│         │               │ REC  │        │BRIDGE│                       │
│         │               └──────┘        └──────┘                       │
│         │                    │               │                         │
│         │                    └───────┬───────┘                         │
│         │                            ▼                                  │
│         │                       ┌──────┐                                │
│         │                       │GUARD │  ← OPUS badge                  │
│         │                       └──────┘                                │
│         │                            │                                  │
│         │  [Message Animation: ════▶]                                  │
│         │                                                               │
└─────────┴───────────────────────────────────────────────────────────────┘
```

**Animations**:
- Nodes pulse when active
- Edges animate with flowing particles/lines when messages pass
- Real-time highlighting of current agent

### 7.5 Memory Inspector

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                  │
├─────────┬─────────────────────────────────┬─────────────────────────────┤
│         │     MEMORY LIST (LEFT)          │    MEMORY DETAIL (RIGHT)    │
│ LEFT    │                                 │                             │
│ NAV     │  [Search memories...]           │    Pattern: PAT-001         │
│         │                                 │    Version: 3               │
│         │  ─────────────────────          │    Confidence: 0.94         │
│         │                                 │                             │
│         │  ● PAT-001 - Packaging Seal     │    Source Cases:            │
│         │    v3 • 94% • 12 cases          │    • case-100               │
│         │                                 │    • case-101               │
│         │  ○ PAT-002 - Label Misprint     │    • ...                    │
│         │    v1 • 87% • 5 cases           │                             │
│         │                                 │    Resolution Template:     │
│         │  ○ RES-TPL-001 - Recurring      │    "Known recurring..."     │
│         │    v2 • Used 45x                │                             │
│         │                                 │    ─────────────────        │
│         │                                 │                             │
│         │                                 │    [View Version History]   │
│         │                                 │    [Delete Memory]          │
│         │                                 │                             │
└─────────┴─────────────────────────────────┴─────────────────────────────┘
```

### 7.6 Cases List

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                  │
├─────────┬───────────────────────────────────────────────────────────────┤
│         │                                                               │
│ LEFT    │  FILTERS: [Type ▼] [Status ▼] [Severity ▼] [Recurring ▼]     │
│ NAV     │                                                               │
│         │  ┌─────────────────────────────────────────────────────────┐  │
│         │  │ ID          │ Type      │ Product        │ Severity │ ● │  │
│         │  ├─────────────────────────────────────────────────────────┤  │
│         │  │ CASE-001    │ COMPLAINT │ Cetaphil Moist │ MEDIUM   │ ● │  │
│         │  │ CASE-002    │ INQUIRY   │ Differin Gel   │ LOW      │   │  │
│         │  │ CASE-003    │ COMPLAINT │ Sculptra       │ HIGH     │   │  │
│         │  └─────────────────────────────────────────────────────────┘  │
│         │                                                               │
│         │  ● = Recurring pattern detected                               │
│         │                                                               │
│         │  Showing 1-20 of 156 cases                    [< 1 2 3 ... >] │
│         │                                                               │
└─────────┴───────────────────────────────────────────────────────────────┘
```

---

## 8. Animation & Motion

### 8.1 Transition Defaults

```css
:root {
  --transition-fast: 100ms ease-out;
  --transition-normal: 150ms ease-out;
  --transition-slow: 300ms ease-out;
  --transition-enter: 200ms ease-out;
  --transition-exit: 150ms ease-in;
}
```

### 8.2 Animation Library

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fade-in` | 200ms | ease-out | Page/panel entrance |
| `slide-up` | 300ms | ease-out | Modal entrance |
| `slide-right` | 300ms | ease-out | Panel expansion |
| `pulse` | 2000ms | ease-in-out | Active agent indicator |
| `flow` | 1500ms | linear | A2A message animation |

### 8.3 Timeline Animation

```css
/* New event slides in */
@keyframes timeline-event-enter {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timeline-event-new {
  animation: timeline-event-enter 200ms ease-out;
}
```

### 8.4 A2A Network Message Flow

```css
/* Message particle flowing along edge */
@keyframes message-flow {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}

.a2a-message {
  offset-path: path('M0,0 L100,100'); /* Dynamic based on edge */
  animation: message-flow 1s ease-in-out;
}
```

---

## 9. Accessibility

### 9.1 Color Contrast Requirements

| Element | Foreground | Background | Ratio | WCAG |
|---------|------------|------------|-------|------|
| Primary text | `#EAEAF0` | `#0F0F14` | 12.8:1 | AAA |
| Secondary text | `#9CA3AF` | `#0F0F14` | 7.1:1 | AAA |
| Tertiary text | `#6B7280` | `#0F0F14` | 4.5:1 | AA |
| Accent on dark | `#00A4B4` | `#0F0F14` | 5.2:1 | AA |

### 9.2 Focus States

```css
/* Focus visible ring */
.focus-ring {
  @apply focus:outline-none;
  @apply focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2;
  @apply focus-visible:ring-offset-bg-base;
}
```

### 9.3 Glassmorphism Fallback

```css
/* Always provide solid fallback */
@supports not (backdrop-filter: blur(16px)) {
  .glass-panel {
    background: rgba(15, 15, 20, 0.92);
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 9.4 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between focusable elements |
| `Shift+Tab` | Navigate backwards |
| `Enter/Space` | Activate focused button/link |
| `Escape` | Close modal/dropdown |
| `Arrow keys` | Navigate within toggle groups |
| `1-5` | Quick mode/language selection (when focused) |

---

## 10. Implementation Guide

### 10.1 Required Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-toggle-group": "^1.0.0",
    "lucide-react": "^0.300.0",
    "framer-motion": "^11.0.0",
    "react-force-graph": "^1.44.0"
  },
  "devDependencies": {
    "colorthief": "^2.4.0"
  }
}
```

### 10.2 Tailwind Configuration

```javascript
// tailwind.config.js
const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0A0C',
        'bg-surface': '#0F0F14',
        'bg-elevated': '#16161D',
        'text-primary': '#EAEAF0',
        'text-secondary': '#9CA3AF',
        'text-tertiary': '#6B7280',
        'accent': 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-active': 'var(--color-accent-active)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      borderRadius: {
        'panel': '16px',
        'panel-lg': '24px',
        'button': '8px',
        'badge': '6px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

### 10.3 Component File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── ModeBadge.tsx
│   │   ├── LanguageToggle.tsx
│   │   └── SeverityBadge.tsx
│   ├── layout/
│   │   ├── TopBar.tsx
│   │   ├── LeftNav.tsx
│   │   ├── MainContent.tsx
│   │   └── RightPanel.tsx
│   ├── timeline/
│   │   ├── Timeline.tsx
│   │   ├── TimelineEvent.tsx
│   │   └── TimelineFilters.tsx
│   ├── network/
│   │   ├── A2AGraph.tsx
│   │   ├── AgentNode.tsx
│   │   └── MessageEdge.tsx
│   └── memory/
│       ├── MemoryList.tsx
│       ├── MemoryDetail.tsx
│       └── VersionHistory.tsx
├── styles/
│   ├── globals.css
│   ├── brand-colors.css (generated)
│   └── animations.css
└── lib/
    └── extract-palette.ts
```

---

## Related Documents

- [PRD.md](./PRD.md) - Main requirements document
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) - Demo walkthrough
- [BUILD_SPEC.md](./BUILD_SPEC.md) - Implementation guide

---

*Design system based on Dark Glassmorphism trends (2026), Apple tvOS design principles, and WCAG 2.1 AA accessibility standards.*
