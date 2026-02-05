// ============================================
// Galderma TrackWise AI Autopilot Demo
// Page: Memory - Memory Browser
// ============================================

import { useState } from 'react'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassPanel } from '@/components/domain/GlassPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ============================================
// Mock Data
// ============================================
const MOCK_PATTERNS = [
  {
    id: 'PAT-001',
    name: 'Cetaphil Packaging Defect',
    confidence: 0.92,
    occurrences: 15,
    status: 'ACTIVE',
    description: 'Recurring issue with tube seal integrity across multiple lots',
    created_at: '2026-01-15T10:23:00Z',
  },
  {
    id: 'PAT-002',
    name: 'Differin Tube Seal Failure',
    confidence: 0.87,
    occurrences: 8,
    status: 'ACTIVE',
    description: 'Customer reports of dried product due to seal degradation',
    created_at: '2026-01-20T14:45:00Z',
  },
  {
    id: 'PAT-003',
    name: 'Restylane Cold Chain Break',
    confidence: 0.74,
    occurrences: 3,
    status: 'PENDING',
    description: 'Possible temperature excursion during shipping - requires validation',
    created_at: '2026-02-01T08:12:00Z',
  },
  {
    id: 'PAT-004',
    name: 'Benzac Pump Dispenser Malfunction',
    confidence: 0.68,
    occurrences: 5,
    status: 'ACTIVE',
    description: 'Mechanical failure preventing product dispensing',
    created_at: '2026-01-28T16:30:00Z',
  },
]

const MOCK_TEMPLATES = [
  {
    id: 'TPL-001',
    name: 'Packaging Defect - Standard Resolution',
    language: 'EN',
    confidence: 0.95,
    uses: 42,
    status: 'ACTIVE',
    template_text: 'We apologize for the packaging issue. We will replace your product and investigate the lot.',
  },
  {
    id: 'TPL-002',
    name: 'Qualidade - Resposta Multilíngue',
    language: 'PT',
    confidence: 0.89,
    uses: 28,
    status: 'ACTIVE',
    template_text: 'Lamentamos o inconveniente. Investigaremos o lote e providenciaremos substituição.',
  },
  {
    id: 'TPL-003',
    name: 'Cold Chain Investigation',
    language: 'EN',
    confidence: 0.78,
    uses: 12,
    status: 'PENDING',
    template_text: 'We are investigating potential temperature excursion. Do not use the product.',
  },
]

const MOCK_POLICIES = [
  {
    id: 'POL-001',
    name: 'Requires Physician Review',
    category: 'SAFETY',
    confidence: 1.0,
    evaluations: 156,
    violations: 3,
    status: 'ENFORCED',
    description: 'Adverse events must be reviewed by medical professional',
  },
  {
    id: 'POL-002',
    name: 'Multi-Site Lot Quarantine',
    category: 'QUALITY',
    confidence: 0.98,
    evaluations: 89,
    violations: 1,
    status: 'ENFORCED',
    description: 'Lots with 3+ complaints across multiple sites must be quarantined',
  },
  {
    id: 'POL-003',
    name: 'Regulatory Filing Trigger',
    category: 'COMPLIANCE',
    confidence: 1.0,
    evaluations: 203,
    violations: 0,
    status: 'ENFORCED',
    description: 'CRITICAL severity cases require regulatory filing within 24h',
  },
  {
    id: 'POL-004',
    name: 'Multilingual Response Mandatory',
    category: 'CUSTOMER_SERVICE',
    confidence: 0.93,
    evaluations: 312,
    violations: 8,
    status: 'ENFORCED',
    description: 'Responses must match customer language or provide translation',
  },
]

// ============================================
// Memory Page Component
// ============================================
export default function Memory() {
  const [activeTab, setActiveTab] = useState('patterns')

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Memory</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Agent Memory Browser - Patterns, Templates & Policy Knowledge
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="patterns">Recurring Patterns</TabsTrigger>
            <TabsTrigger value="templates">Resolution Templates</TabsTrigger>
            <TabsTrigger value="policies">Policy Knowledge</TabsTrigger>
          </TabsList>

          {/* Recurring Patterns Tab */}
          <TabsContent value="patterns">
            <GlassPanel className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recurring Patterns
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Patterns detected by Memory Curator from processed cases
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono">Pattern ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead className="text-right">Occurrences</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_PATTERNS.map((pattern) => (
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
                  Resolution Templates
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Multilingual resolution templates learned from successful resolutions
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono">Template ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead className="text-right">Uses</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_TEMPLATES.map((template) => (
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
                  Policy Knowledge
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Compliance policies enforced by Compliance Guardian
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono">Policy ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Evaluations</TableHead>
                    <TableHead className="text-right">Violations</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_POLICIES.map((policy) => (
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
      </div>
    </div>
  )
}
