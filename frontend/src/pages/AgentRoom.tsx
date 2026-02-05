// ============================================
// Galderma TrackWise AI Autopilot Demo
// Agent Room - Main Dashboard Page
// ============================================

import { useEffect, useRef } from 'react'
import { CheckCircle2, Zap, Shield, Activity, RotateCcw, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useExecutiveStats, useStats, useCreateBatch, useResetDemo } from '@/hooks'
import { useTimelineStore, useFilteredEvents } from '@/stores'
import { AGENTS } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard, TimelineItem, GlassPanel, EmptyState } from '@/components/domain'

/**
 * AgentRoom - Premium AI Agent Dashboard
 *
 * Main executive dashboard showing:
 * - Executive metrics (AI closed, hours saved, risks avoided)
 * - Status counters (total, open, in progress, closed)
 * - Real-time activity timeline with agent events
 *
 * Features:
 * - Auto-refreshing stats (5s interval)
 * - WebSocket-driven timeline updates
 * - Batch case creation
 * - Demo reset capability
 * - Agent-specific filtering
 */
export default function AgentRoom() {
  const { data: executiveStats, isLoading: executiveLoading } = useExecutiveStats()
  const { data: stats, isLoading: statsLoading } = useStats()
  const createBatch = useCreateBatch()
  const resetDemo = useResetDemo()

  const filteredEvents = useFilteredEvents()
  const { filter, setFilter, autoScroll } = useTimelineStore()

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to top when new events arrive (if autoScroll enabled)
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = 0
      }
    }
  }, [filteredEvents.length, autoScroll])

  // Handle create batch mutation
  const handleCreateBatch = () => {
    createBatch.mutate(
      {
        count: 5,
        include_recurring: true,
        include_adverse_events: true,
        include_linked_inquiries: true,
      },
      {
        onSuccess: (data) => {
          toast.success(`Created ${data.created_count} cases successfully`, {
            description: `${data.events_emitted} events emitted`,
          })
        },
        onError: (error) => {
          toast.error('Failed to create batch', {
            description: error instanceof Error ? error.message : 'Unknown error',
          })
        },
      }
    )
  }

  // Handle reset demo mutation
  const handleResetDemo = () => {
    resetDemo.mutate(undefined, {
      onSuccess: (data) => {
        toast.success('Demo reset successfully', {
          description: `Cleared ${data.cases_cleared} cases and ${data.events_cleared} events`,
        })
      },
      onError: (error) => {
        toast.error('Failed to reset demo', {
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Agent Room</h1>
          <p className="text-text-secondary mt-1">AI Autopilot Executive Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateBatch}
            disabled={createBatch.isPending}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            {createBatch.isPending ? 'Creating...' : 'Create Batch'}
          </Button>
          <Button
            onClick={handleResetDemo}
            disabled={resetDemo.isPending}
            variant="destructive"
            className="font-medium"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetDemo.isPending ? 'Resetting...' : 'Reset Demo'}
          </Button>
        </div>
      </div>

      {/* Executive Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {executiveLoading ? (
          <>
            <Skeleton className="h-32 bg-glass-bg border border-glass-border rounded-xl" />
            <Skeleton className="h-32 bg-glass-bg border border-glass-border rounded-xl" />
            <Skeleton className="h-32 bg-glass-bg border border-glass-border rounded-xl" />
          </>
        ) : executiveStats ? (
          <>
            <MetricCard
              value={executiveStats.ai_closed_count.toLocaleString()}
              label="AI Closed"
              sublabel={`of ${executiveStats.total_cases.toLocaleString()} total`}
              icon={CheckCircle2}
              color="#10B981"
            />
            <MetricCard
              value={executiveStats.human_hours_saved.toLocaleString()}
              label="Hours Saved"
              sublabel="vs manual processing"
              icon={Zap}
              color="#06B6D4"
            />
            <MetricCard
              value={executiveStats.risks_avoided.toLocaleString()}
              label="Risks Avoided"
              sublabel="escalations prevented"
              icon={Shield}
              color="#8B5CF6"
            />
          </>
        ) : (
          <div className="col-span-3 text-center text-text-muted py-8">
            Failed to load executive metrics
          </div>
        )}
      </div>

      {/* Status Counters Row */}
      {statsLoading ? (
        <Skeleton className="h-12 bg-glass-bg border border-glass-border rounded-lg" />
      ) : stats ? (
        <GlassPanel variant="surface" className="px-6 py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Total:</span>
              <span className="text-brand-primary font-mono font-semibold">
                {stats.total_cases.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-glass-border" />
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Open:</span>
              <span className="text-status-warning font-mono font-semibold">
                {stats.open_cases.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-glass-border" />
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">In Progress:</span>
              <span className="text-brand-accent font-mono font-semibold">
                {stats.in_progress_cases.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-glass-border" />
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Closed:</span>
              <span className="text-status-success font-mono font-semibold">
                {stats.closed_cases.toLocaleString()}
              </span>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {/* Activity Timeline Section */}
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Activity Timeline</h2>
          <Select value={filter || 'all'} onValueChange={(value) => setFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[200px] bg-bg-elevated border-glass-border">
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-glass-border">
              <SelectItem value="all">All Agents</SelectItem>
              {Object.values(AGENTS).map((agent) => (
                <SelectItem key={agent.name} value={agent.name}>
                  {agent.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px]" ref={scrollAreaRef}>
          {filteredEvents.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Waiting for agent events..."
              className="py-12"
            />
          ) : (
            <div className="space-y-3 pr-4">
              {filteredEvents.map((event, index) => (
                <TimelineItem key={`${event.timestamp}-${index}`} event={event} />
              ))}
            </div>
          )}
        </ScrollArea>
      </GlassPanel>
    </div>
  )
}
