'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Send, ShieldCheck, X } from 'lucide-react'
import type { AssistantAction } from '../../../server/services/assistant'
import { NexMascot } from '../../../components/nex-mascot'
import type { AssistantIdentity } from '../../../lib/use-assistant-identity'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function actionLabel(action: AssistantAction) {
  switch (action.type) {
    case 'create_event':
      return `Add “${action.title}” to Calendar`
    case 'create_task':
      return `Create task “${action.title}”`
    case 'create_note':
      return `Save note “${action.title}”`
    case 'create_transaction':
      return `Record ${action.transactionType.toLowerCase()} of ₱${action.amount.toLocaleString()}`
    case 'create_user':
      return `Add ${action.name} as ${action.userRole}`
    case 'send_message':
      return `Send message to ${action.recipientName}`
    case 'complete_task':
      return `Complete “${action.title}”`
    case 'reschedule_event':
      return `Reschedule “${action.title}”`
    case 'update_note':
      return `Update “${action.title}”`
    case 'update_transaction':
      return `Update ${action.transactionType.toLowerCase()} entry`
    case 'create_reminder':
      return `Create reminder “${action.title}”`
  }
}

export function FloatingNexChat({
  identity,
  pathname,
}: {
  identity: AssistantIdentity
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const pageName = pathname.split('/').filter(Boolean).at(-1)?.replace(/-/g, ' ') ?? 'dashboard'

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return
    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [messages, pendingAction, loading, reduceMotion])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  async function sendMessage(content: string) {
    const text = content.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setPendingAction(null)
    setLoading(true)

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-20),
          conversationId: conversationId ?? undefined,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        message?: string
        action?: AssistantAction | null
        conversationId?: string
        error?: string
      }
      if (!response.ok) throw new Error(data.error)

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.message ?? 'How can I help?' },
      ])
      setPendingAction(data.action ?? null)
      if (data.conversationId) setConversationId(data.conversationId)
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error && error.message
              ? error.message
              : 'I could not reach the ARKO workspace. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function confirmAction() {
    if (!pendingAction || actionLoading) return
    setActionLoading(true)

    try {
      const response = await fetch('/api/assistant/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingAction),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(data.error)
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Done. The approved change is now saved in ARKO.' },
      ])
      setPendingAction(null)
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error && error.message
              ? error.message
              : 'I could not complete that action.',
        },
      ])
    } finally {
      setActionLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void sendMessage(input)
  }

  return (
    <aside className="fixed bottom-16 right-3 z-40 md:bottom-5 md:right-5" aria-label={`${identity.assistantName} assistant`}>
      <AnimatePresence>
        {open && (
          <motion.section
            id="floating-nex-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
            className="absolute bottom-16 right-0 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden border border-primary-500/40 bg-[#090b0a]/95 text-text-primary shadow-[10px_10px_0_rgba(34,197,94,0.16),0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl [clip-path:polygon(0_0,calc(100%-1.25rem)_0,100%_1.25rem,100%_100%,0_100%)]"
            role="dialog"
            aria-modal="false"
            aria-labelledby="floating-nex-title"
          >
            <div className="h-1 shrink-0 bg-primary-500" />
            <header className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(34,197,94,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,.7)_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="relative flex min-w-0 items-center gap-3">
                <NexMascot iconStyle={identity.iconStyle} accentColor={identity.accentColor} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id="floating-nex-title" className="text-sm font-black uppercase tracking-[0.12em]">
                      {identity.assistantName}
                    </h2>
                    <span className="h-1.5 w-1.5 bg-primary-500 shadow-[0_0_12px_rgba(34,197,94,.9)]" />
                  </div>
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-text-tertiary">
                    Context / {pageName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative grid h-11 w-11 place-items-center border border-white/10 text-text-secondary transition-colors hover:border-primary-500/50 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={messageListRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4" role="log" aria-label="NEX conversation" aria-live="polite">
              <div className="flex min-h-full flex-col justify-end gap-3">
                {messages.length === 0 && (
                  <div className="border-l-2 border-primary-500 bg-primary-500/[0.06] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary-500">System link ready</p>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      Ask about this page or your ARKO workspace. I’ll request confirmation before changing records.
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-8' : 'mr-8'}>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">
                      {message.role === 'user' ? 'You / input' : `${identity.assistantName} / response`}
                    </p>
                    <div className={message.role === 'user' ? 'border-r-2 border-primary-500 bg-primary-500 px-3 py-2.5 text-sm leading-relaxed text-[#061009]' : 'border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm leading-relaxed text-text-primary'}>
                      {message.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="mr-8 border border-white/10 bg-white/[0.035] px-3 py-2.5" role="status" aria-label={`${identity.assistantName} is thinking`}>
                    <motion.span
                      animate={reduceMotion ? undefined : { backgroundPosition: ['100% center', '-100% center'] }}
                      transition={reduceMotion ? undefined : { duration: 1.6, ease: 'linear', repeat: Infinity }}
                      className="bg-[length:250%_100%] bg-clip-text font-mono text-[10px] uppercase tracking-[0.14em] text-transparent"
                      style={{ backgroundImage: `linear-gradient(90deg,var(--color-text-tertiary),${identity.accentColor},var(--color-text-tertiary))` }}
                    >
                      Reading ARKO records…
                    </motion.span>
                  </div>
                )}

                {pendingAction && (
                  <div className="border border-primary-500/40 bg-primary-500/[0.07] p-3">
                    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-primary-500">
                      <ShieldCheck className="h-3.5 w-3.5" /> Approval required
                    </div>
                    <p className="mt-2 text-sm font-medium">{actionLabel(pendingAction)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void confirmAction()}
                        disabled={actionLoading}
                        className="flex min-h-11 items-center justify-center gap-2 bg-primary-500 px-3 text-xs font-bold uppercase tracking-wider text-[#061009] disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> {actionLoading ? 'Saving' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingAction(null)}
                        className="min-h-11 border border-white/15 px-3 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/40 p-3">
              <label htmlFor="floating-nex-input" className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">
                Command input
              </label>
              <div className="flex items-center border border-white/15 bg-black/50 focus-within:border-primary-500/70">
                <input
                  ref={inputRef}
                  id="floating-nex-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={2_000}
                  placeholder={`Ask ${identity.assistantName}…`}
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-text-primary outline-none placeholder:text-text-tertiary"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="mr-1 grid h-10 w-10 shrink-0 place-items-center bg-primary-500 text-[#061009] transition-opacity disabled:opacity-35"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((current) => !current)}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        aria-expanded={open}
        aria-controls="floating-nex-panel"
        aria-label={`${open ? 'Close' : 'Open'} ${identity.assistantName} assistant`}
        className="group relative flex h-14 items-center border border-primary-500/45 bg-[#090b0a]/95 pl-2 pr-4 text-text-primary shadow-[6px_6px_0_rgba(34,197,94,0.2),0_16px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary-500" />
        <NexMascot iconStyle={identity.iconStyle} accentColor={identity.accentColor} size="sm" />
        <span className="ml-2 text-left">
          <span className="block text-xs font-black uppercase tracking-[0.13em]">Ask {identity.assistantName}</span>
          <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-primary-500">Workspace online</span>
        </span>
      </motion.button>
    </aside>
  )
}
