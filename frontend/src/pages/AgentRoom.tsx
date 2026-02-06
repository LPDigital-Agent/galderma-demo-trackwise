// ============================================
// Galderma TrackWise AI Autopilot Demo
// Agent Room - Main Dashboard Page
// ============================================

import { useEffect, useRef } from 'react'
import { CheckCircle2, Zap, Shield, Activity, RotateCcw, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { agentRoom as t } from '@/i18n'
import { useExecutiveStats, useStats, useCreateBatch, useResetDemo, useCreateGaldermaScenario } from '@/hooks'
import { useTimelineStore, useFilteredEvents } from '@/stores'
import { AGENTS } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard, TimelineItem, GlassPanel, EmptyState } from '@/components/domain'

export default function AgentRoom() {
  const { data: executiveStats, isLoading: executiveLoading } = useExecutiveStats()
  const { data: stats, isLoading: statsLoading } = useStats()
  const createBatch = useCreateBatch()
  const createScenario = useCreateGaldermaScenario()
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
          toast.success(t.toasts.batchSuccess(data.created_count), {
            description: t.toasts.batchEvents(data.events_emitted),
          })
        },
        onError: (error) => {
          toast.error(t.toasts.batchError, {
            description: error instanceof Error ? error.message : 'Unknown error',
          })
        },
      }
    )
  }

  const handleCreateScenario = () => {
    createScenario.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(t.toasts.scenarioSuccess(data.created_count), {
          description: t.toasts.scenarioDescription,
        })
      },
      onError: (error) => {
        toast.error(t.toasts.scenarioError, {
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      },
    })
  }

  const handleResetDemo = () => {
    resetDemo.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(t.toasts.resetSuccess, {
          description: t.toasts.resetCleared(data.cases_cleared, data.events_cleared),
        })
      },
      onError: (error) => {
        toast.error(t.toasts.resetError, {
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      },
    })
  }

  return (
    <div className="space-y-[var(--float-gap)]">
      {/* Header Section */}
      <div className="glass-float p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t.title}</h1>
            <p className="text-text-secondary mt-1">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleCreateScenario}
              disabled={createScenario.isPending}
              className="font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {createScenario.isPending ? t.creatingScenario : t.createScenario}
            </Button>
            <Button
              onClick={handleCreateBatch}
              disabled={createBatch.isPending}
              variant="outline"
              className="font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createBatch.isPending ? t.creating : t.createBatch}
            </Button>
            <Button
              onClick={handleResetDemo}
              disabled={resetDemo.isPending}
              variant="destructive"
              className="font-medium"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {resetDemo.isPending ? t.resetting : t.resetDemo}
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--float-gap)]">
        {executiveLoading ? (
          <>
            <Skeleton className="h-32 glass-float" />
            <Skeleton className="h-32 glass-float" />
            <Skeleton className="h-32 glass-float" />
          </>
        ) : executiveStats ? (
          <>
            <MetricCard
              value={executiveStats.ai_closed_count.toLocaleString()}
              label={t.metrics.aiClosed}
              sublabel={t.metrics.aiClosedSublabel(executiveStats.total_cases.toLocaleString())}
              icon={CheckCircle2}
              color="#10B981"
            />
            <MetricCard
              value={executiveStats.human_hours_saved.toLocaleString()}
              label={t.metrics.hoursSaved}
              sublabel={t.metrics.hoursSavedSublabel}
              icon={Zap}
              color="#06B6D4"
            />
            <MetricCard
              value={executiveStats.risks_avoided.toLocaleString()}
              label={t.metrics.risksAvoided}
              sublabel={t.metrics.risksAvoidedSublabel}
              icon={Shield}
              color="#8B5CF6"
            />
          </>
        ) : (
          <div className="col-span-3 text-center text-text-muted py-8">
            {t.failedMetrics}
          </div>
        )}
      </div>

      {/* Status Counters Row */}
      {statsLoading ? (
        <Skeleton className="h-12 glass-float" />
      ) : stats ? (
        <GlassPanel variant="floating" className="px-6 py-4">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">{t.counters.total}</span>
              <span className="text-brand-primary font-mono font-semibold">
                {stats.total_cases.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-black/10" />
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">{t.counters.open}</span>
              <span className="text-status-warning font-mono font-semibold">
                {stats.open_cases.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-black/10" />
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">{t.counters.inProgress}</span>
              <span className="text-brand-accent font-mono font-semibold">
                {stats.in_progress_cases.toLocaleString()}
              </span>
            </div>
            <div className="h-4 w-px bg-black/10" />
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">{t.counters.closed}</span>
              <span className="text-status-success font-mono font-semibold">
                {stats.closed_cases.toLocaleString()}
              </span>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {/* Activity Timeline Section */}
      <GlassPanel variant="floating" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{t.activityTimeline}</h2>
          <Select value={filter || 'all'} onValueChange={(value) => setFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[200px] bg-white/20 border-white/30">
              <SelectValue placeholder={t.filterByAgent} />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated border-glass-border">
              <SelectItem value="all">{t.allAgents}</SelectItem>
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
              title={t.noActivityTitle}
              description={t.noActivityDescription}
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
