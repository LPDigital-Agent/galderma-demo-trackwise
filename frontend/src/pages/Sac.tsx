// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: SAC / Atendimento - Case Generator
// ============================================

import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Headphones,
  Plus,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Link as LinkIcon,
  FileQuestion,
  Package,
  Shuffle,
  RotateCcw,
  Play,
  Square,
} from 'lucide-react'

import { sac as t, DATE_LOCALE } from '@/i18n'
import { useSacGenerate } from '@/hooks/useSac'
import { useSacStore } from '@/stores/sacStore'
import { StatusBadge, SeverityBadge, EmptyState } from '@/components/domain'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import type { SacScenario } from '@/stores/sacStore'

// ============================================
// Constants
// ============================================
const GALDERMA_BRANDS = [
  'CETAPHIL',
  'DIFFERIN',
  'EPIDUO',
  'RESTYLANE',
  'DYSPORT',
  'SCULPTRA',
  'SOOLANTRA',
  'ORACEA',
  'BENZAC',
  'LOCERYL',
] as const

const SCENARIO_CONFIG: Array<{
  value: SacScenario
  icon: typeof RefreshCcw
  label: string
  description: string
}> = [
  { value: 'RECURRING_COMPLAINT', icon: RefreshCcw, label: t.scenarios.RECURRING_COMPLAINT, description: t.scenarios.RECURRING_COMPLAINT_DESC },
  { value: 'ADVERSE_EVENT_HIGH', icon: AlertTriangle, label: t.scenarios.ADVERSE_EVENT_HIGH, description: t.scenarios.ADVERSE_EVENT_HIGH_DESC },
  { value: 'LINKED_INQUIRY', icon: LinkIcon, label: t.scenarios.LINKED_INQUIRY, description: t.scenarios.LINKED_INQUIRY_DESC },
  { value: 'MISSING_DATA', icon: FileQuestion, label: t.scenarios.MISSING_DATA, description: t.scenarios.MISSING_DATA_DESC },
  { value: 'MULTI_PRODUCT_BATCH', icon: Package, label: t.scenarios.MULTI_PRODUCT_BATCH, description: t.scenarios.MULTI_PRODUCT_BATCH_DESC },
  { value: 'RANDOM', icon: Shuffle, label: t.scenarios.RANDOM, description: t.scenarios.RANDOM_DESC },
]

// ============================================
// Helper
// ============================================
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(DATE_LOCALE, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================
// SAC Page Component
// ============================================
export default function Sac() {
  const navigate = useNavigate()
  const generate = useSacGenerate()

  const {
    scenario,
    productBrand,
    generatedCases,
    sessionStats,
    simulatorActive,
    setScenario,
    setProductBrand,
    toggleSimulator,
    resetSession,
  } = useSacStore()

  return (
    <div className="flex flex-col h-full gap-[var(--float-gap)]">
      {/* Header */}
      <header className="glass-shell flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <Headphones className="h-5 w-5 text-[var(--brand-accent)]" />
          </div>
          <div>
            <h1
              className="text-lg font-semibold text-[var(--lg-text-primary)]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {t.title}
            </h1>
            <p className="text-sm text-[var(--lg-text-secondary)]">{t.subtitle}</p>
          </div>
          {sessionStats.total > 0 && (
            <Badge
              variant="secondary"
              className="bg-[var(--brand-primary)]/15 text-[var(--brand-accent)] border-[var(--brand-primary)]/30"
            >
              {sessionStats.total}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {sessionStats.total > 0 && (
            <Button variant="ghost" size="sm" onClick={resetSession}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={() => generate.mutate('single')} disabled={generate.isPending}>
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {generate.isPending ? t.generating : t.generate}
          </Button>
          <Button
            variant={simulatorActive ? 'destructive' : 'default'}
            onClick={toggleSimulator}
            className={simulatorActive ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
          >
            {simulatorActive ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                {t.stopSimulator}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t.startSimulator}
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Config Panel */}
      <section className="glass-shell p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Scenario Toggle */}
          <div className="md:col-span-2 lg:col-span-2 space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[var(--lg-text-tertiary)]">
              {t.scenarios.label}
            </Label>
            <ToggleGroup
              type="single"
              value={scenario}
              onValueChange={(val) => { if (val) setScenario(val as SacScenario) }}
              variant="outline"
              size="sm"
              className="flex-wrap"
            >
              {SCENARIO_CONFIG.map(({ value, icon: Icon, label }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  aria-label={label}
                  className="gap-1.5 text-xs data-[state=on]:bg-[var(--brand-primary)]/20 data-[state=on]:text-[var(--brand-accent)] data-[state=on]:border-[var(--brand-primary)]/40"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Product Brand */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[var(--lg-text-tertiary)]">
              {t.config.product}
            </Label>
            <Select
              value={productBrand ?? 'ALL'}
              onValueChange={(val) => setProductBrand(val === 'ALL' ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.config.allBrands} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.config.allBrands}</SelectItem>
                {GALDERMA_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </section>

      {/* Live Feed */}
      <main className="flex-1 glass-shell overflow-auto p-5">
        {generatedCases.length === 0 ? (
          <EmptyState
            icon={Headphones}
            title={t.feed.empty}
            description={t.feed.emptyHint}
          />
        ) : (
          <div className="space-y-3">
            {generatedCases.map((c, i) => (
              <motion.div
                key={c.case_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div
                  onClick={() => navigate(`/cases/${c.case_id}`)}
                  className="glass-card cursor-pointer rounded-xl p-4 transition-all hover:-translate-y-[1px] hover:shadow-[0_18px_28px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Top row: Case ID + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-[var(--brand-accent)]">
                          {c.case_id}
                        </span>
                        <StatusBadge status={c.status} />
                        <SeverityBadge severity={c.severity} />
                        {c.category && (
                          <Badge
                            variant="outline"
                            className="bg-white/8 text-[var(--lg-text-secondary)] border-white/15 text-[10px]"
                          >
                            {c.category}
                          </Badge>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--lg-text-primary)]">
                          {c.product_brand}
                        </span>
                        <span className="text-sm text-[var(--lg-text-secondary)]">
                          {c.product_name}
                        </span>
                      </div>

                      {/* Complaint preview */}
                      <p className="mt-1.5 text-sm text-[var(--lg-text-secondary)] line-clamp-2">
                        <span className="text-[var(--lg-text-tertiary)]">{t.feed.complaint}</span>{' '}
                        {c.complaint_text}
                      </p>

                      {/* Bottom row: customer + time */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--lg-text-tertiary)]">
                        <span>
                          {t.feed.customer} <strong className="text-[var(--lg-text-secondary)]">{c.customer_name}</strong>
                        </span>
                        <span className="font-mono">{formatDate(c.created_at)}</span>
                        {c.linked_case_id && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            {c.linked_case_id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Click hint */}
                    <span className="shrink-0 text-xs text-[var(--lg-text-tertiary)] hidden md:block">
                      {t.feed.clickToView}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Stats Footer */}
      <AnimatePresence>
        {sessionStats.total > 0 && (
          <motion.footer
            className="glass-shell p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex flex-wrap gap-6 text-sm text-[var(--lg-text-secondary)]">
              <span>
                {t.stats.generated}:{' '}
                <strong className="text-[var(--lg-text-primary)]">{sessionStats.total}</strong>
              </span>
              <span>
                {t.stats.recurring}:{' '}
                <strong className="text-[var(--lg-text-primary)]">{sessionStats.recurring}</strong>
              </span>
              <span>
                {t.stats.adverse}:{' '}
                <strong className="text-[var(--lg-text-primary)]">{sessionStats.adverse}</strong>
              </span>
              <span>
                {t.stats.linked}:{' '}
                <strong className="text-[var(--lg-text-primary)]">{sessionStats.linked}</strong>
              </span>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  )
}
