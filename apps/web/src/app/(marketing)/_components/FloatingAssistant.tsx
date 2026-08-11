'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { NexMascot } from '../../../components/nex-mascot'
import { useAssistantIdentity } from '../../../lib/use-assistant-identity'

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false)
  const identity = useAssistantIdentity()

  return (
    <aside
      className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] right-3 z-[45] flex flex-col items-end gap-2 md:bottom-5 md:right-5"
      aria-label={identity.assistantName}
    >
      {open && (
        <div className="w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden border border-white/20 bg-ink/75 p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.18em] text-acid">
                {identity.assistantName}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Ask about your workspace, create tasks, or schedule events. Your role controls what it can access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Link
            href="/dashboard/assistant"
            className="mono mt-4 flex min-h-11 items-center justify-center border border-acid bg-acid px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-white"
          >
            Open assistant <span className="ml-2" aria-hidden>→</span>
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-12 items-center gap-2 border border-white/20 bg-ink/75 px-3 text-white shadow-[0_12px_38px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-colors hover:border-acid/70"
        aria-expanded={open}
      >
        <NexMascot
          iconStyle={identity.iconStyle}
          accentColor={identity.accentColor}
          size="sm"
        />
        <span className="mono text-[10px] font-bold uppercase tracking-[0.14em]">
          Ask {identity.assistantName}
        </span>
      </button>
    </aside>
  )
}
