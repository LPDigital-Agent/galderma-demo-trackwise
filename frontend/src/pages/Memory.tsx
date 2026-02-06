// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: Memory - Memory Browser
// ============================================

import { useState } from 'react'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { memory as t } from '@/i18n'
import { useMemory } from '@/hooks'
import { GlassPanel, EmptyState } from '@/components/domain'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ============================================
// Memory Page Component
// ============================================
export default function Memory() {
  const [activeTab, setActiveTab] = useState('patterns')
  const { data: memory, isLoading } = useMemory()

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.5) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ENFORCED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const patterns = memory?.patterns ?? []
  const templates = memory?.templates ?? []
  const policies = memory?.policies ?? []
  const isEmpty = patterns.length === 0 && templates.length === 0 && policies.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-glass-bg border border-glass-border rounded-lg" />
            <Skeleton className="h-64 w-full bg-glass-bg border border-glass-border rounded-xl" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={Brain}
            title={t.emptyTitle}
            description={t.emptyDescription}
            className="py-24"
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="patterns">{t.tabs.patterns}</TabsTrigger>
              <TabsTrigger value="templates">{t.tabs.templates}</TabsTrigger>
              <TabsTrigger value="policies">{t.tabs.policies}</TabsTrigger>
            </TabsList>

            {/* Recurring Patterns Tab */}
            <TabsContent value="patterns">
              <GlassPanel className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t.patterns.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {t.patterns.description}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">{t.patterns.headers.patternId}</TableHead>
                      <TableHead>{t.patterns.headers.name}</TableHead>
                      <TableHead>{t.patterns.headers.description}</TableHead>
                      <TableHead className="text-right">{t.patterns.headers.confidence}</TableHead>
                      <TableHead className="text-right">{t.patterns.headers.occurrences}</TableHead>
                      <TableHead>{t.patterns.headers.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patterns.map((pattern) => (
                      <TableRow key={pattern.id}>
                        <TableCell className="font-mono text-cyan-400">
                          {pattern.id}
                        </TableCell>
                        <TableCell className="font-medium text-[var(--text-primary)]">
                          {pattern.name}
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)] text-sm max-w-md">
                          {pattern.description}
                        </TableCell>
                        <TableCell className={cn('text-right font-mono', getConfidenceColor(pattern.confidence))}>
                          {Math.round(pattern.confidence * 100)}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-[var(--text-primary)]">
                          {pattern.occurrences}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(pattern.status)}>
                            {pattern.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlassPanel>
            </TabsContent>

            {/* Resolution Templates Tab */}
            <TabsContent value="templates">
              <GlassPanel className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t.templates.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {t.templates.description}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">{t.templates.headers.templateId}</TableHead>
                      <TableHead>{t.templates.headers.name}</TableHead>
                      <TableHead>{t.templates.headers.language}</TableHead>
                      <TableHead className="text-right">{t.templates.headers.confidence}</TableHead>
                      <TableHead className="text-right">{t.templates.headers.uses}</TableHead>
                      <TableHead>{t.templates.headers.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-mono text-cyan-400">
                          {template.id}
                        </TableCell>
                        <TableCell className="font-medium text-[var(--text-primary)]">
                          {template.name}
                        </TableCell>
                        <TableCell className="font-mono text-[var(--text-secondary)]">
                          {template.language}
                        </TableCell>
                        <TableCell className={cn('text-right font-mono', getConfidenceColor(template.confidence))}>
                          {Math.round(template.confidence * 100)}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-[var(--text-primary)]">
                          {template.uses}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(template.status)}>
                            {template.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlassPanel>
            </TabsContent>

            {/* Policy Knowledge Tab */}
            <TabsContent value="policies">
              <GlassPanel className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t.policies.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {t.policies.description}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">{t.policies.headers.policyId}</TableHead>
                      <TableHead>{t.policies.headers.name}</TableHead>
                      <TableHead>{t.policies.headers.category}</TableHead>
                      <TableHead>{t.policies.headers.description}</TableHead>
                      <TableHead className="text-right">{t.policies.headers.evaluations}</TableHead>
                      <TableHead className="text-right">{t.policies.headers.violations}</TableHead>
                      <TableHead>{t.policies.headers.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-mono text-cyan-400">
                          {policy.id}
                        </TableCell>
                        <TableCell className="font-medium text-[var(--text-primary)]">
                          {policy.name}
                        </TableCell>
                        <TableCell className="font-mono text-[var(--text-secondary)] text-xs">
                          {policy.category}
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)] text-sm max-w-md">
                          {policy.description}
                        </TableCell>
                        <TableCell className="text-right font-mono text-[var(--text-primary)]">
                          {policy.evaluations}
                        </TableCell>
                        <TableCell className={cn(
                          'text-right font-mono',
                          policy.violations === 0 ? 'text-green-400' : 'text-amber-400'
                        )}>
                          {policy.violations}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(policy.status)}>
                            {policy.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GlassPanel>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
