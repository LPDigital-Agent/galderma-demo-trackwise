// ============================================
// Galderma TrackWise AI Autopilot Demo
// UI Showcase - Component Usage Examples
// ============================================

import {
  GlassCard,
  Button,
  Badge,
  SeverityBadge,
  ModeBadge,
  LanguageToggle,
  ModeToggle,
} from './index'

/**
 * UIShowcase Component
 *
 * Demonstrates usage of all UI components.
 * This is a reference implementation showing:
 * - Component composition
 * - Variant usage
 * - Responsive layouts
 * - Proper spacing and typography
 *
 * Use this as a guide for building production pages.
 */
export function UIShowcase() {
  return (
    <div className="min-h-screen p-8 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            UI Component Showcase
          </h1>
          <p className="text-[var(--text-secondary)]">
            Glassmorphism design system for TrackWise AI Autopilot
          </p>
        </div>

        {/* GlassCard Variants */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            GlassCard Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard variant="default" className="p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Default
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Standard glass with translucent background and blur
              </p>
            </GlassCard>

            <GlassCard variant="surface" className="p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Surface
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Uses bg-surface background color
              </p>
            </GlassCard>

            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Elevated
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Elevated with stronger shadow effect
              </p>
            </GlassCard>

            <GlassCard variant="hover" className="p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Hover
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Interactive card with hover effect
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Buttons
          </h2>
          <GlassCard className="p-6">
            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Variants
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Sizes
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">
                    Small
                  </Button>
                  <Button variant="primary" size="md">
                    Medium
                  </Button>
                  <Button variant="primary" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              {/* Disabled State */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Disabled State
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" disabled>
                    Disabled Primary
                  </Button>
                  <Button variant="secondary" disabled>
                    Disabled Secondary
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Badges
          </h2>
          <GlassCard className="p-6">
            <div className="space-y-6">
              {/* Status Badges */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Status Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              {/* Severity Badges */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Severity Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  <SeverityBadge severity="LOW" />
                  <SeverityBadge severity="MEDIUM" />
                  <SeverityBadge severity="HIGH" />
                  <SeverityBadge severity="CRITICAL" />
                </div>
              </div>

              {/* Mode Badges */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Mode Badges
                </h3>
                <div className="flex flex-wrap gap-3">
                  <ModeBadge mode="OBSERVE" />
                  <ModeBadge mode="TRAIN" />
                  <ModeBadge mode="ACT" />
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Toggles */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Toggle Components
          </h2>
          <GlassCard className="p-6">
            <div className="space-y-6">
              {/* Language Toggle */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Language Toggle
                </h3>
                <LanguageToggle />
              </div>

              {/* Mode Toggle */}
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Mode Toggle
                </h3>
                <ModeToggle />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Complex Example */}
        <section>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Complex Example - Case Card
          </h2>
          <GlassCard variant="hover" className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    CASE-001
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Cetaphil Daily Facial Moisturizer
                  </p>
                </div>
                <SeverityBadge severity="MEDIUM" />
              </div>

              {/* Content */}
              <p className="text-sm text-[var(--text-primary)]">
                Customer reported packaging seal was broken upon delivery. Product
                appears unused but customer concerned about contamination.
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">COMPLAINT</Badge>
                <Badge variant="default">PACKAGING</Badge>
                <ModeBadge mode="ACT" showIcon={false} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="primary" size="sm">
                  View Details
                </Button>
                <Button variant="secondary" size="sm">
                  View Timeline
                </Button>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  )
}
