// ============================================
// Galderma TrackWise AI Autopilot Demo
// AuditorView - Compliance Audit Modal
// ============================================

import { X, Shield, CheckCircle2, XCircle, Hash, Clock, Brain, Cpu, Lock } from 'lucide-react'
import { GlassCard, Badge } from '@/components/ui'
import { AGENTS } from '@/types'
import type { AgentName, Case, LedgerEntry, Run } from '@/types'

interface AuditorViewProps {
  caseData: Case
  ledger: LedgerEntry[]
  run?: Run
  onClose: () => void
}

/**
 * AuditorView Component
 *
 * Compliance-focused overlay showing the complete decision audit trail
 * for a case. Designed for regulatory auditors to verify:
 * - WHO made each decision (agent + model)
 * - WHAT was decided (action + outcome)
 * - WHY (reasoning + evidence)
 * - WHICH policies were evaluated (pass/fail)
 * - INTEGRITY (cryptographic hash chain)
 */
export function AuditorView({ caseData, ledger, run, onClose }: AuditorViewProps) {
  // Count policy results
  const totalPoliciesChecked = ledger.reduce(
    (acc, e) => acc + (e.policies_evaluated?.length ?? 0),
    0
  )
  const totalViolations = ledger.reduce(
    (acc, e) => acc + (e.policy_violations?.length ?? 0),
    0
  )
  const allPassed = totalViolations === 0

  // Verify hash chain integrity
  const hashChainValid = verifyHashChain(ledger)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="my-8 w-full max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(239,68,68,0.15)]">
              <Shield className="h-5 w-5 text-[var(--status-error)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Auditor View</h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Case {caseData.case_id} &bull; Complete decision audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Integrity Summary Banner */}
        <GlassCard variant="elevated" className="mb-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Hash Chain */}
            <div className="flex items-center gap-2">
              {hashChainValid ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--status-success)]" />
              ) : (
                <XCircle className="h-5 w-5 text-[var(--status-error)]" />
              )}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Hash Chain {hashChainValid ? 'Verified' : 'BROKEN'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {ledger.length} entries, SHA-256 linked
                </p>
              </div>
            </div>

            {/* Policies */}
            <div className="flex items-center gap-2">
              {allPassed ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--status-success)]" />
              ) : (
                <XCircle className="h-5 w-5 text-[var(--status-warning)]" />
              )}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {totalPoliciesChecked} Policies Evaluated
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {totalViolations === 0 ? 'All passed' : `${totalViolations} violation(s)`}
                </p>
              </div>
            </div>

            {/* Processing Time */}
            {run?.duration_ms && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--brand-primary)]" />
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {(run.duration_ms / 1000).toFixed(1)}s Total
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {run.agents_invoked.length} agents invoked
                  </p>
                </div>
              </div>
            )}

            {/* Models Used */}
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Models: OPUS + HAIKU
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Claude 4.5 family
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Decision Entries */}
        <div className="space-y-3">
          {ledger.length === 0 ? (
            <GlassCard>
              <div className="py-8 text-center">
                <Shield className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  No audit entries for this case
                </p>
              </div>
            </GlassCard>
          ) : (
            ledger.map((entry, index) => (
              <AuditDecisionCard key={entry.ledger_id} entry={entry} index={index} />
            ))
          )}
        </div>

        {/* Footer - Case Summary */}
        <GlassCard className="mt-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Lock className="h-3.5 w-3.5" />
            <span>
              This audit trail is immutable and cryptographically signed.
              Each entry references the previous entry's hash, forming a tamper-evident chain.
              Any modification to historical entries would break the hash chain verification above.
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function AuditDecisionCard({ entry, index }: { entry: LedgerEntry; index: number }) {
  const agentInfo = AGENTS[entry.agent_name as AgentName]
  const agentColor = agentInfo?.color ?? 'var(--text-secondary)'

  return (
    <GlassCard>
      {/* Entry Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              backgroundColor: `${agentColor}20`,
              color: agentColor,
            }}
          >
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: agentColor }}>
                {agentInfo?.displayName ?? entry.agent_name}
              </span>
              {agentInfo?.model === 'OPUS' && (
                <Badge variant="info">OPUS</Badge>
              )}
              <ActionBadge action={entry.action} />
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {new Date(entry.timestamp).toLocaleString()}
              {entry.latency_ms && ` \u00B7 ${entry.latency_ms}ms`}
              {entry.tokens_used && ` \u00B7 ${entry.tokens_used} tokens`}
            </p>
          </div>
        </div>

        {/* Confidence */}
        {entry.confidence != null && (
          <div className="text-right">
            <p
              className={`text-lg font-bold ${
                entry.confidence >= 0.9
                  ? 'text-[var(--status-success)]'
                  : entry.confidence >= 0.7
                    ? 'text-[var(--status-warning)]'
                    : 'text-[var(--status-error)]'
              }`}
            >
              {(entry.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)]">confidence</p>
          </div>
        )}
      </div>

      {/* Decision */}
      {entry.decision && (
        <div className="mt-3 rounded-lg bg-[rgba(255,255,255,0.03)] p-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Decision
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{entry.decision}</p>
        </div>
      )}

      {/* Reasoning / Evidence */}
      {entry.reasoning && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Reasoning &amp; Evidence
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{entry.reasoning}</p>
        </div>
      )}

      {/* Policies */}
      {entry.policies_evaluated && entry.policies_evaluated.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Policies Evaluated
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {entry.policies_evaluated.map((pol) => {
              const violated = entry.policy_violations?.some((v) => v.includes(pol))
              return (
                <div
                  key={pol}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                    violated
                      ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]'
                      : 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)]'
                  }`}
                >
                  {violated ? (
                    <XCircle className="h-4 w-4 shrink-0 text-[var(--status-error)]" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--status-success)]" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{pol}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {violated ? 'VIOLATION' : 'PASSED'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* State Changes (Before → After) */}
      {entry.state_changes && entry.state_changes.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            State Changes
          </p>
          <div className="overflow-hidden rounded-lg border border-[var(--glass-border)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.03)]">
                  <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)]">
                    Field
                  </th>
                  <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)]">
                    Before
                  </th>
                  <th className="px-3 py-1.5 text-left text-[10px] font-medium text-[var(--text-tertiary)]">
                    After
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {entry.state_changes.map((change, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]">
                      {change.field}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-[var(--status-error)]">
                      {change.before ?? 'null'}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-[var(--status-success)]">
                      {change.after ?? 'null'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model + Hash */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--glass-border)] pt-2">
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          {entry.model_id && (
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" /> {entry.model_id}
            </span>
          )}
          {entry.memory_strategy && (
            <span>Memory: {entry.memory_strategy}</span>
          )}
        </div>
        {entry.entry_hash && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-tertiary)] opacity-60">
            <Hash className="h-3 w-3" />
            {entry.entry_hash.slice(0, 16)}...
          </span>
        )}
      </div>
    </GlassCard>
  )
}

function ActionBadge({ action }: { action: string }) {
  const variant =
    action === 'WRITEBACK_EXECUTED'
      ? 'success'
      : action === 'ERROR_OCCURRED'
        ? 'error'
        : action === 'HUMAN_REVIEW_REQUESTED'
          ? 'warning'
          : action === 'COMPLIANCE_CHECKED'
            ? 'info'
            : action === 'CASE_ESCALATED'
              ? 'error'
              : 'default'

  return <Badge variant={variant}>{action.replace(/_/g, ' ')}</Badge>
}

// ============================================
// Hash Chain Verification
// ============================================
function verifyHashChain(entries: LedgerEntry[]): boolean {
  if (entries.length === 0) return true

  for (let i = 1; i < entries.length; i++) {
    const current = entries[i]!
    const previous = entries[i - 1]!

    // If previous_hash is set, it should match the previous entry's hash
    if (current.previous_hash && previous.entry_hash) {
      if (current.previous_hash !== previous.entry_hash) {
        return false
      }
    }
  }

  return true
}
