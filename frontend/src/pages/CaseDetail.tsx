// ============================================
// Galderma TrackWise AI Autopilot Demo
// CaseDetail Page - Case Detail with Timeline
// ============================================

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Brain,
  Cpu,
  Zap,
  FileSearch,
  Link2,
  Eye,
  ArrowRight,
} from 'lucide-react'
import { GlassCard, Button, Badge, SeverityBadge } from '@/components/ui'
import { AuditorView } from '@/components/AuditorView'
import { useCase } from '@/hooks'
import { useCaseRuns, useCaseLedger } from '@/hooks/useCaseDetail'
import { useLanguageStore } from '@/stores'
import { AGENTS } from '@/types'
import type { AgentName, AgentStep, Case, Language, LedgerEntry } from '@/types'

// Agent step icon mapping
const STEP_ICONS: Record<string, typeof Brain> = {
  observer: Zap,
  case_understanding: Brain,
  recurring_detector: FileSearch,
  compliance_guardian: Shield,
  resolution_composer: Cpu,
  inquiry_bridge: Link2,
  writeback: CheckCircle2,
  memory_curator: Brain,
  csv_pack: FileSearch,
}

// Get resolution text for current language
function getResolutionForLanguage(caseData: Case, language: Language): string | undefined {
  switch (language) {
    case 'PT':
      return caseData.resolution_text_pt
    case 'EN':
      return caseData.resolution_text_en
    case 'ES':
      return caseData.resolution_text_es
    case 'FR':
      return caseData.resolution_text_fr
    case 'AUTO':
    default:
      return caseData.resolution_text_en || caseData.resolution_text || caseData.resolution_text_pt
  }
}

/**
 * CaseDetail Page
 *
 * Full case detail with:
 * - Case info (product, complaint, severity, status)
 * - Multi-language resolution text
 * - Processing timeline (agent steps from Run)
 * - Linked case indicator
 * - Audit trail entries
 */
export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const { data: caseData, isLoading: caseLoading } = useCase(caseId ?? '')
  const { data: runs } = useCaseRuns(caseId ?? '')
  const { data: ledger } = useCaseLedger(caseId ?? '')
  const language = useLanguageStore((s) => s.language)
  const [showAuditor, setShowAuditor] = useState(false)

  // Fetch linked case data for Inquiry Bridge visualization
  const linkedCaseId = caseData?.linked_case_id
  const { data: linkedCase } = useCase(linkedCaseId ?? '', { enabled: !!linkedCaseId })

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading case...</p>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-[var(--status-warning)]" />
        <p className="mt-2 text-[var(--text-primary)]">Case not found</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/cases')}>
          Back to Cases
        </Button>
      </div>
    )
  }

  const currentRun = runs?.[0]
  const steps = currentRun?.agent_steps ?? []
  const resolution = getResolutionForLanguage(caseData, language)

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
          <ArrowLeft className="h-4 w-4" />
          Cases
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {caseData.case_id}
            </h1>
            <SeverityBadge severity={caseData.severity} />
            <Badge
              variant={
                caseData.status === 'CLOSED'
                  ? 'success'
                  : caseData.status === 'OPEN'
                    ? 'warning'
                    : 'info'
              }
            >
              {caseData.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="default">{caseData.case_type}</Badge>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAuditor(true)}
          disabled={!ledger || ledger.length === 0}
        >
          <Eye className="h-4 w-4" />
          Auditor View
        </Button>
      </div>

      {/* Auditor Mode Overlay */}
      {showAuditor && ledger && (
        <AuditorView
          caseData={caseData}
          ledger={ledger}
          run={currentRun}
          onClose={() => setShowAuditor(false)}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Case info + Resolution */}
        <div className="space-y-6 lg:col-span-1">
          {/* Case Information */}
          <GlassCard>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Case Information
            </h2>
            <div className="space-y-3">
              <InfoRow label="Product" value={`${caseData.product_brand} — ${caseData.product_name}`} />
              <InfoRow label="Category" value={caseData.category || '—'} />
              <InfoRow label="Customer" value={caseData.customer_name} />
              <InfoRow label="Type" value={caseData.case_type} />
              {caseData.lot_number && <InfoRow label="Lot" value={caseData.lot_number} />}
              <InfoRow label="Created" value={new Date(caseData.created_at).toLocaleString()} />
              {caseData.closed_at && (
                <InfoRow label="Closed" value={new Date(caseData.closed_at).toLocaleString()} />
              )}
              {caseData.ai_confidence != null && (
                <InfoRow label="AI Confidence" value={`${(caseData.ai_confidence * 100).toFixed(0)}%`} />
              )}
              {caseData.processed_by_agent && (
                <InfoRow label="Processed By" value={caseData.processed_by_agent} />
              )}
            </div>
          </GlassCard>

          {/* Complaint Text */}
          <GlassCard>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Complaint
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">
              {caseData.complaint_text}
            </p>
          </GlassCard>

          {/* Inquiry Bridge Visualization */}
          {caseData.linked_case_id && (
            <GlassCard variant="elevated">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <Link2 className="mr-1.5 inline h-4 w-4" />
                Inquiry Bridge
              </h2>

              {/* Visual connection between cases */}
              <div className="space-y-2">
                {/* This case */}
                <div
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: caseData.status === 'CLOSED' ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)',
                    backgroundColor: caseData.status === 'CLOSED' ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={caseData.case_type === 'COMPLAINT' ? 'error' : 'info'}>
                        {caseData.case_type}
                      </Badge>
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {caseData.case_id}
                      </span>
                    </div>
                    <Badge variant={caseData.status === 'CLOSED' ? 'success' : 'warning'}>
                      {caseData.status}
                    </Badge>
                  </div>
                </div>

                {/* Arrow connector */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-px flex-1 bg-[var(--glass-border)]" />
                  <div className="flex items-center gap-1 text-xs text-[var(--brand-primary)]">
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {caseData.case_type === 'COMPLAINT' ? 'triggers closure' : 'auto-closed by'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <div className="h-px flex-1 bg-[var(--glass-border)]" />
                </div>

                {/* Linked case */}
                <Link
                  to={`/cases/${caseData.linked_case_id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                  style={{
                    borderColor: linkedCase?.status === 'CLOSED' ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)',
                    backgroundColor: linkedCase?.status === 'CLOSED' ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={caseData.case_type === 'COMPLAINT' ? 'info' : 'error'}>
                        {caseData.case_type === 'COMPLAINT' ? 'INQUIRY' : 'COMPLAINT'}
                      </Badge>
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {caseData.linked_case_id}
                      </span>
                      <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)]" />
                    </div>
                    {linkedCase ? (
                      <Badge variant={linkedCase.status === 'CLOSED' ? 'success' : 'warning'}>
                        {linkedCase.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[var(--text-tertiary)]">Loading...</span>
                    )}
                  </div>
                  {linkedCase && (
                    <p className="mt-1.5 line-clamp-1 text-xs text-[var(--text-tertiary)]">
                      {linkedCase.product_brand} — {linkedCase.complaint_text}
                    </p>
                  )}
                </Link>
              </div>

              <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                {caseData.case_type === 'INQUIRY'
                  ? 'This inquiry is linked to the above complaint. When the complaint closes, this inquiry auto-closes via the Inquiry Bridge agent.'
                  : 'This complaint has a linked inquiry. When this complaint is resolved, the Inquiry Bridge agent automatically closes the linked inquiry.'}
              </p>
            </GlassCard>
          )}

          {/* Resolution (multi-language) */}
          {caseData.status === 'CLOSED' && (
            <GlassCard>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Resolution ({language === 'AUTO' ? 'EN' : language})
              </h2>
              {resolution ? (
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">{resolution}</p>
              ) : (
                <p className="text-sm italic text-[var(--text-tertiary)]">No resolution text in this language</p>
              )}

              {/* All languages preview */}
              <div className="mt-4 space-y-2 border-t border-[var(--glass-border)] pt-3">
                <p className="text-xs font-medium text-[var(--text-tertiary)]">All languages:</p>
                {(['EN', 'PT', 'ES', 'FR'] as const).map((lang) => {
                  const text = getResolutionForLanguage(caseData, lang)
                  return (
                    <div key={lang} className="flex gap-2">
                      <Badge variant={text ? 'success' : 'default'} className="shrink-0">{lang}</Badge>
                      <p className="line-clamp-1 text-xs text-[var(--text-tertiary)]">
                        {text || 'Not available'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right column: Processing Timeline + Audit Trail */}
        <div className="space-y-6 lg:col-span-2">
          {/* Processing Timeline */}
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Processing Timeline
              </h2>
              {currentRun && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      currentRun.status === 'COMPLETED'
                        ? 'success'
                        : currentRun.status === 'FAILED'
                          ? 'error'
                          : 'warning'
                    }
                  >
                    {currentRun.status}
                  </Badge>
                  {currentRun.duration_ms && (
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {(currentRun.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              )}
            </div>

            {steps.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Waiting for agent processing...
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-5 top-2 bottom-2 w-px bg-[var(--glass-border)]" />

                <div className="space-y-1">
                  {steps.map((step, index) => (
                    <TimelineStep
                      key={step.step_number}
                      step={step}
                      isActive={index === steps.length - 1 && currentRun?.status === 'RUNNING'}
                    />
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Audit Trail */}
          <GlassCard>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Audit Trail
            </h2>

            {!ledger || ledger.length === 0 ? (
              <div className="py-6 text-center">
                <Shield className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  No audit entries yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ledger.map((entry) => (
                  <AuditEntry key={entry.ledger_id} entry={entry} />
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--text-tertiary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

function TimelineStep({
  step,
  isActive,
}: {
  step: AgentStep
  isActive: boolean
}) {
  const agentInfo = AGENTS[step.agent_name as AgentName]
  const Icon = STEP_ICONS[step.agent_name] ?? Brain
  const agentColor = agentInfo?.color ?? 'var(--text-secondary)'

  return (
    <div className="relative flex gap-3 py-2 pl-1">
      {/* Timeline dot */}
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
          isActive ? 'animate-pulse' : ''
        }`}
        style={{
          backgroundColor: `${agentColor}20`,
          borderColor: `${agentColor}60`,
          color: agentColor,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: agentColor }}>
            {agentInfo?.displayName ?? step.agent_name}
          </span>
          <Badge variant="default">{step.step_type}</Badge>
          {agentInfo?.model === 'OPUS' && (
            <Badge variant="info">OPUS</Badge>
          )}
          {step.duration_ms && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {step.duration_ms}ms
            </span>
          )}
        </div>

        {step.output_summary && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{step.output_summary}</p>
        )}

        {step.reasoning && (
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
            {step.reasoning}
          </p>
        )}

        {step.tools_called && step.tools_called.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {step.tools_called.map((tool) => (
              <span
                key={tool}
                className="rounded bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AuditEntry({ entry }: { entry: LedgerEntry }) {
  const agentInfo = AGENTS[entry.agent_name as AgentName]
  const agentColor = agentInfo?.color ?? 'var(--text-secondary)'

  const actionVariant =
    entry.action === 'WRITEBACK_EXECUTED'
      ? 'success'
      : entry.action === 'ERROR_OCCURRED'
        ? 'error'
        : entry.action === 'HUMAN_REVIEW_REQUESTED'
          ? 'warning'
          : 'default'

  return (
    <div className="rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)] p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: agentColor }}>
            {agentInfo?.displayName ?? entry.agent_name}
          </span>
          <Badge variant={actionVariant}>{entry.action.replace(/_/g, ' ')}</Badge>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {entry.action_description && (
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{entry.action_description}</p>
      )}

      {entry.reasoning && (
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">{entry.reasoning}</p>
      )}

      {/* Decision + Confidence */}
      {(entry.decision || entry.confidence != null) && (
        <div className="mt-2 flex items-center gap-3">
          {entry.decision && (
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Decision: {entry.decision}
            </span>
          )}
          {entry.confidence != null && (
            <span className="text-xs text-[var(--text-tertiary)]">
              Confidence: {(entry.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Policies */}
      {entry.policies_evaluated && entry.policies_evaluated.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.policies_evaluated.map((pol) => (
            <span
              key={pol}
              className={`rounded px-1.5 py-0.5 text-[10px] ${
                entry.policy_violations?.some((v) => v.includes(pol))
                  ? 'bg-[rgba(239,68,68,0.15)] text-[var(--status-error)]'
                  : 'bg-[rgba(34,197,94,0.15)] text-[var(--status-success)]'
              }`}
            >
              {pol} {entry.policy_violations?.some((v) => v.includes(pol)) ? 'FAIL' : 'PASS'}
            </span>
          ))}
        </div>
      )}

      {/* State changes */}
      {entry.state_changes && entry.state_changes.length > 0 && (
        <div className="mt-2 space-y-1">
          {entry.state_changes.map((change, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="text-[var(--text-tertiary)]">{change.field}:</span>
              <span className="text-[var(--status-error)]">{change.before ?? 'null'}</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="text-[var(--status-success)]">{change.after ?? 'null'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hash chain */}
      {entry.entry_hash && (
        <div className="mt-2 text-[10px] font-mono text-[var(--text-tertiary)] opacity-50">
          Hash: {entry.entry_hash.slice(0, 16)}...
        </div>
      )}
    </div>
  )
}
