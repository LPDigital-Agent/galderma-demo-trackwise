// ============================================
// Galderma TrackWise AI Autopilot Demo
// CSVPack Page - CSV Pack Generator
// ============================================

import { Package, FileText, CheckCircle2 } from 'lucide-react'
import { GlassCard, Button, Badge } from '@/components/ui'

const CSV_ARTIFACTS = [
  { name: 'Requirements Traceability Matrix', icon: FileText },
  { name: 'Test Execution Report', icon: CheckCircle2 },
  { name: 'Validation Summary', icon: FileText },
  { name: 'Risk Assessment', icon: FileText },
  { name: 'Change Control Log', icon: FileText },
  { name: 'User Acceptance Test', icon: CheckCircle2 },
]

/**
 * CSVPack Page
 *
 * Generate Computer System Validation (CSV) compliance documentation.
 *
 * Features:
 * - Generate complete CSV pack (6 artifacts)
 * - List of recent packs
 * - Pack detail view with artifacts
 * - Download individual artifacts (future)
 *
 * Note:
 * - CSV = Computer System Validation (21 CFR Part 11)
 * - NOT Comma Separated Values
 */
export function CSVPack() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">CSV Pack</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Computer System Validation compliance documentation (21 CFR Part 11)
          </p>
        </div>
        <Button variant="primary" size="md">
          <Package className="h-4 w-4" />
          Generate Pack
        </Button>
      </div>

      {/* CSV Pack Info */}
      <GlassCard>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">What is CSV Pack?</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              The CSV Pack generates complete Computer System Validation documentation required for
              FDA 21 CFR Part 11 compliance. Each pack includes 6 essential artifacts:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CSV_ARTIFACTS.map(({ name, icon: Icon }) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-[var(--border-radius-sm)] border border-[var(--glass-border)] p-3"
              >
                <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
                <span className="text-sm text-[var(--text-primary)]">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Recent Packs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Recent Packs</h2>
        <GlassCard>
          <div className="flex min-h-[300px] items-center justify-center py-12">
            <div className="text-center">
              <Package className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
              <p className="mt-4 text-sm text-[var(--text-secondary)]">No CSV packs generated yet</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                Click "Generate Pack" to create your first compliance documentation package
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Pack Details (Future) */}
      <GlassCard>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Pack Details</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Total Artifacts</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                6 documents per pack
              </p>
            </div>
            <Badge variant="default">
              {CSV_ARTIFACTS.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Compliance Standard</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                FDA regulations
              </p>
            </div>
            <Badge variant="default">
              21 CFR Part 11
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Format</p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Signed PDF documents
              </p>
            </div>
            <Badge variant="success">
              PDF
            </Badge>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
