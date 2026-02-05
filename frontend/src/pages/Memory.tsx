// ============================================
// Galderma TrackWise AI Autopilot Demo
// Memory Page - Memory Browser
// ============================================

import { useState } from 'react'
import { Brain, Database } from 'lucide-react'
import { GlassCard, Button } from '@/components/ui'
import type { MemoryStrategy } from '@/types'

const MEMORY_STRATEGIES: { value: MemoryStrategy; label: string; description: string }[] = [
  {
    value: 'RecurringPatterns',
    label: 'Recurring Patterns',
    description: 'Similar complaints and resolution patterns',
  },
  {
    value: 'ResolutionTemplates',
    label: 'Resolution Templates',
    description: 'Approved response templates by category',
  },
  {
    value: 'PolicyKnowledge',
    label: 'Policy Knowledge',
    description: 'Compliance rules and regulatory requirements',
  },
]

/**
 * Memory Page
 *
 * Browse and manage AgentCore memory strategies.
 *
 * Features:
 * - Three strategy tabs (RecurringPatterns, ResolutionTemplates, PolicyKnowledge)
 * - Memory entry list (placeholder)
 * - Memory detail panel (placeholder)
 * - Version history (future)
 *
 * Performance:
 * - Lazy load memory entries per strategy
 * - Virtual scrolling for large lists
 */
export function Memory() {
  const [activeStrategy, setActiveStrategy] = useState<MemoryStrategy>('RecurringPatterns')

  const currentStrategy = MEMORY_STRATEGIES.find((s) => s.value === activeStrategy)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Memory</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          AgentCore memory strategies and learned patterns
        </p>
      </div>

      {/* Strategy Tabs */}
      <GlassCard>
        <div className="flex gap-2 border-b border-[rgba(0,0,0,0.06)] pb-3">
          {MEMORY_STRATEGIES.map((strategy) => (
            <Button
              key={strategy.value}
              variant={activeStrategy === strategy.value ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setActiveStrategy(strategy.value)}
            >
              {strategy.label}
            </Button>
          ))}
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {currentStrategy?.label}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {currentStrategy?.description}
          </p>
        </div>
      </GlassCard>

      {/* Memory Entries */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Entry List */}
        <div className="lg:col-span-2">
          <GlassCard className="h-[600px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Entries</h2>
              <Button variant="secondary" size="sm">
                <Database className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="flex h-[calc(100%-3rem)] items-center justify-center">
              <div className="text-center">
                <Brain className="mx-auto h-16 w-16 text-[var(--text-tertiary)]" />
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  No memory entries yet
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Memory entries will appear as agents learn from cases
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Entry Detail */}
        <div className="lg:col-span-1">
          <GlassCard className="h-[600px]">
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Details</h2>

            <div className="flex h-[calc(100%-3rem)] items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)]">Select an entry to view</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
