'use client'

import { useActionState, useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import { type ContactState, sendContact } from '../actions/contact'
import StarBorder from './StarBorder'

const LS_KEY = 'arko_submitted'
const initial: ContactState = { status: 'idle' }

const FIELDS = [
  { name: 'name', label: 'Your name', type: 'text' },
  { name: 'email', label: 'Work email', type: 'email' },
] as const

const PROJECT_TYPES = ['Website', 'Mobile app', 'Automation', 'AI feature'] as const

function readPersisted(): ContactState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as ContactState
    if (p.status === 'success' || p.status === 'exhausted') return p
    return null
  } catch {
    return null
  }
}

function persist(st: ContactState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(st)) } catch { /* noop */ }
}

export default function ContactForm() {
  const [doneState, setDoneState] = useState<ContactState | null>(null)
  const [message, setMessage] = useState('')
  const [state, formAction, pending] = useActionState(sendContact, initial)

  // Hydration-safe: restore from localStorage after mount
  useEffect(() => {
    setDoneState(readPersisted())
  }, [])

  useEffect(() => {
    const receiveIdea = (event: Event) => {
      const idea = (event as CustomEvent<string>).detail
      if (idea) setMessage(idea)
    }
    window.addEventListener('arko:funnel', receiveIdea)
    return () => window.removeEventListener('arko:funnel', receiveIdea)
  }, [])

  // Persist done states so they survive future refreshes
  useEffect(() => {
    if (state.status === 'success' || state.status === 'exhausted') {
      persist(state)
      setDoneState(state)
    }
  }, [state])

  // — render —
  // Use live state if done, otherwise fall back to persisted state
  const final: ContactState | null =
    state.status === 'success' || state.status === 'exhausted' ? state : doneState

  if (final && final.status === 'success') {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <p className="display text-3xl text-acid md:text-4xl">Message sent.</p>
        <p className="max-w-sm text-base font-medium text-white/70">{final.message}</p>
      </div>
    )
  }

  if (final && final.status === 'exhausted') {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <p className="display text-3xl text-acid md:text-4xl">Inbox full.</p>
        <p className="max-w-sm text-base font-medium text-white/70">
          Thanks for reaching out. Reach us directly at{' '}
          <a href="mailto:arkodevph@gmail.com" className="text-acid underline underline-offset-4">
            arkodevph@gmail.com
          </a>
        </p>
      </div>
    )
  }

  // SSR / first paint: match the form so hydration doesn't mismatch
  return (
    <form id="contact-form" action={formAction} className="relative flex flex-col gap-6 border-2 border-white/15 bg-white/[0.025] p-5 shadow-[10px_10px_0_rgba(184,255,46,.12)] md:p-8">
      <div className="border-b border-white/10 pb-5">
        <p className="eyebrow text-acid">Project brief / 01</p>
        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/55">A few details are enough. We&apos;ll help shape the rest together.</p>
      </div>

      <fieldset>
        <legend className="eyebrow mb-3 text-white/50">What can we build for you?</legend>
        <div className="grid grid-cols-2 gap-2">
          {PROJECT_TYPES.map((type) => (
            <label key={type} className="group cursor-pointer">
              <input className="peer sr-only" type="radio" name="projectType" value={type} required />
              <span className="mono flex min-h-12 items-center justify-between border border-white/15 px-3 text-[0.62rem] font-bold uppercase tracking-wider text-white/50 transition-all group-hover:border-acid/50 group-hover:text-white peer-checked:border-acid peer-checked:bg-acid peer-checked:text-ink">
                {type}<CheckCircle2 className="h-3.5 w-3.5 opacity-30" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="flex flex-col gap-2">
            <span className="eyebrow text-white/50">{f.label}</span>
            <input name={f.name} type={f.type} required autoComplete={f.name} placeholder={f.name === 'name' ? 'How should we address you?' : 'you@company.com'} className="min-h-12 border border-white/15 bg-ink px-4 text-base font-medium text-white outline-none transition-all placeholder:text-white/20 hover:border-white/30 focus:border-acid focus:ring-2 focus:ring-acid/15" />
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-2">
        <span className="flex items-center justify-between"><span className="eyebrow text-white/50">What are you building?</span><span className="mono text-[0.52rem] text-white/25">{message.length}/1200</span></span>
        <textarea
          name="message"
          rows={3}
          required
          value={message}
          maxLength={1200}
          placeholder="The idea, who it is for, and what success looks like..."
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-32 resize-none border border-white/15 bg-ink p-4 text-base font-medium leading-relaxed text-white outline-none transition-all placeholder:text-white/20 hover:border-white/30 focus:border-acid focus:ring-2 focus:ring-acid/15"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2"><span className="eyebrow text-white/50">Working budget</span><select name="budget" className="min-h-12 border border-white/15 bg-ink px-4 text-sm font-medium text-white outline-none focus:border-acid"><option value="Not sure yet">Not sure yet</option><option value="Under ₱50k">Under ₱50k</option><option value="₱50k–₱150k">₱50k–₱150k</option><option value="₱150k+">₱150k+</option></select></label>
        <label className="flex flex-col gap-2"><span className="eyebrow text-white/50">Ideal start</span><select name="timeline" className="min-h-12 border border-white/15 bg-ink px-4 text-sm font-medium text-white outline-none focus:border-acid"><option value="As soon as possible">As soon as possible</option><option value="Within a month">Within a month</option><option value="1–3 months">1–3 months</option><option value="Just exploring">Just exploring</option></select></label>
      </div>

      {state.status === 'error' && (
        <p className="mono text-sm text-red-400" aria-live="polite">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="mono flex flex-wrap gap-x-4 gap-y-2 text-[0.54rem] uppercase tracking-wider text-white/35"><span className="flex items-center gap-1.5"><Clock3 className="h-3 w-3 text-acid" /> Reply within one day</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-acid" /> No pressure</span></div>
        <StarBorder as="button" disabled={pending} className="shrink-0">
          {pending ? 'Sending brief...' : 'Start the conversation →'}
        </StarBorder>
      </div>
    </form>
  )
}
