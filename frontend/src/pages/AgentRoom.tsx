// ============================================
// Galderma TrackWise AI Autopilot Demo
// Agent Room - Main Dashboard Page
// ============================================

import { useEffect, useRef } from 'react'
import { Activity, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { agentRoom as t } from '@/i18n'
import { useCreateBatch, useCreateGaldermaScenario, useResetDemo, useStats } from '@/hooks'
import { useFilteredEvents, useTimelineStore } from '@/stores'
import { AGENTS } from '@/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, GlassPanel, TimelineItem } from '@/components/domain'

export default function AgentRoom() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const createBatch = useCreateBatch()
  const createScenario = useCreateGaldermaScenario()
  const resetDemo = useResetDemo()

  const filteredEvents = useFilteredEvents()
  const { filter, setFilter, autoScroll } = useTimelineStore()

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoScroll || !scrollAreaRef.current) return

    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (viewport) {
      viewport.scrollTop = 0
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
      <GlassPanel variant="shell" className="space-y-4 p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--lg-text-primary)]">{t.title}</h2>
            <p className="mt-1 text-sm text-[var(--lg-text-secondary)]">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button onClick={handleCreateScenario} disabled={createScenario.isPending} className="font-semibold">
              <Sparkles className="mr-1 h-4 w-4" />
              {createScenario.isPending ? t.creatingScenario : t.createScenario}
            </Button>

            <Button onClick={handleCreateBatch} disabled={createBatch.isPending} variant="outline" className="font-medium">
              <Plus className="mr-1 h-4 w-4" />
              {createBatch.isPending ? t.creating : t.createBatch}
            </Button>

            <Button
              onClick={handleResetDemo}
              disabled={resetDemo.isPending}
              variant="destructive"
              className="font-medium"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              {resetDemo.isPending ? t.resetting : t.resetDemo}
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <Skeleton className="glass-control h-16" />
        ) : stats ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            <div className="glass-control px-4 py-3">
              <p className="text-xs uppercase tracking-[0.03em] text-[var(--lg-text-tertiary)]">{t.counters.total}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--lg-text-primary)]">{stats.total_cases.toLocaleString()}</p>
            </div>
            <div className="glass-control px-4 py-3">
              <p className="text-xs uppercase tracking-[0.03em] text-[var(--lg-text-tertiary)]">{t.counters.open}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--status-warning)]">{stats.open_cases.toLocaleString()}</p>
            </div>
            <div className="glass-control px-4 py-3">
              <p className="text-xs uppercase tracking-[0.03em] text-[var(--lg-text-tertiary)]">{t.counters.inProgress}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--brand-secondary)]">
                {stats.in_progress_cases.toLocaleString()}
              </p>
            </div>
            <div className="glass-control px-4 py-3">
              <p className="text-xs uppercase tracking-[0.03em] text-[var(--lg-text-tertiary)]">{t.counters.closed}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--status-success)]">
                {stats.closed_cases.toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
      </GlassPanel>

      <GlassPanel variant="shell" className="space-y-4 p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/8">
              <Activity className="h-4 w-4 text-[var(--brand-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--lg-text-primary)]">{t.activityTimeline}</h3>
          </div>

          <Select value={filter ?? 'all'} onValueChange={(value) => setFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t.filterByAgent} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allAgents}</SelectItem>
              {Object.values(AGENTS).map((agent) => (
                <SelectItem key={agent.name} value={agent.name}>
                  {agent.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[460px]" ref={scrollAreaRef}>
          {filteredEvents.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t.noActivityTitle}
              description={t.noActivityDescription}
              className="py-16"
            />
          ) : (
            <div className="space-y-2 pr-2">
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
