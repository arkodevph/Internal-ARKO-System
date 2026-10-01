'use client'

import { Building2, Lock } from 'lucide-react'
import type { RecordScope } from '../lib/record-scope'

export function RecordScopeField({
  value,
  onChange,
  disabled = false,
  label = 'Who can see this?',
}: {
  value: RecordScope
  onChange: (scope: RecordScope) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-xs font-medium text-text-secondary">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <ScopeOption active={value === 'PERSONAL'} icon={Lock} label="Personal" description="Private to you" onClick={() => onChange('PERSONAL')} />
        <ScopeOption active={value === 'COMPANY'} icon={Building2} label="Company" description="Shared with your team" onClick={() => onChange('COMPANY')} />
      </div>
    </fieldset>
  )
}

function ScopeOption({
  active,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean
  icon: typeof Lock
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-12 items-center gap-2 rounded-md border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border-subtle text-text-tertiary hover:text-text-secondary'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[10px] opacity-70">{description}</span>
      </span>
    </button>
  )
}

export function RecordScopeBadge({ scope }: { scope: RecordScope }) {
  const company = scope === 'COMPANY'
  const Icon = company ? Building2 : Lock
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${company ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border-subtle text-text-tertiary'}`}
    >
      <Icon className="h-3 w-3" />
      {company ? 'Company' : 'Personal'}
    </span>
  )
}
