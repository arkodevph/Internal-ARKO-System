'use client'

import { Building2, Lock } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { RecordScope } from '../lib/record-scope'

const STORAGE_KEY = 'arko:workspace-scope'

const WorkspaceScopeContext = createContext<{
  scope: RecordScope
  setScope: (scope: RecordScope) => void
} | null>(null)

export function WorkspaceScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScopeState] = useState<RecordScope>('PERSONAL')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'PERSONAL' || saved === 'COMPANY') setScopeState(saved)
  }, [])

  const value = useMemo(() => ({
    scope,
    setScope(next: RecordScope) {
      setScopeState(next)
      window.localStorage.setItem(STORAGE_KEY, next)
    },
  }), [scope])

  return <WorkspaceScopeContext.Provider value={value}>{children}</WorkspaceScopeContext.Provider>
}

export function useWorkspaceScope() {
  const value = useContext(WorkspaceScopeContext)
  if (!value) throw new Error('useWorkspaceScope must be used within WorkspaceScopeProvider')
  return value
}

export function WorkspaceScopeSwitcher({ allowCompany = true }: { allowCompany?: boolean }) {
  const { scope, setScope } = useWorkspaceScope()

  useEffect(() => {
    if (!allowCompany && scope === 'COMPANY') setScope('PERSONAL')
  }, [allowCompany, scope, setScope])

  const options = [
    { value: 'PERSONAL' as const, label: 'Personal', detail: 'Private to you', icon: Lock },
    ...(allowCompany
      ? [{ value: 'COMPANY' as const, label: 'Company', detail: 'Shared with your team', icon: Building2 }]
      : []),
  ]

  return (
    <div className="flex min-w-0 items-center gap-2" aria-label="Workspace context">
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary lg:block">
        Viewing
      </span>
      <div className="dashboard-segmented inline-flex min-h-10 items-center p-1">
        {options.map((option) => {
          const Icon = option.icon
          const active = scope === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              title={`${option.label}: ${option.detail}`}
              onClick={() => setScope(option.value)}
              className={`flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app ${
                active
                  ? 'bg-primary-500 text-white'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
      <span className="hidden text-xs text-text-tertiary xl:block" aria-live="polite">
        {scope === 'PERSONAL' ? 'Only your records' : 'Team-shared records'}
      </span>
    </div>
  )
}
