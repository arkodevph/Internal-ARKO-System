'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  Check,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type { AssistantAction } from '../../../server/services/assistant'
import { useReducedMotion } from 'motion/react'
import { NexMascot } from '../../../components/nex-mascot'
import {
  DEFAULT_ASSISTANT_IDENTITY,
  useAssistantIdentity,
} from '../../../lib/use-assistant-identity'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const STARTER: Message = {
  role: 'assistant',
  content: DEFAULT_ASSISTANT_IDENTITY.greeting,
}

const SUGGESTIONS = [
  'What can you do?',
  'Create a high-priority task to review the landing page',
  'Record an income of 1,000 pesos',
  'Add a note: Send a cold text to clients through WhatsApp',
]

export default function AssistantPage() {
  const identity = useAssistantIdentity()
  const [messages, setMessages] = useState<Message[]>([STARTER])
  const [input, setInput] = useState('')
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0]?.role === 'assistant'
        ? [{ role: 'assistant', content: identity.greeting }]
        : current,
    )
  }, [identity.greeting])

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [messages, pendingAction, loading, reduceMotion])

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
        body: JSON.stringify({ messages: nextMessages.slice(-20) }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        message?: string
        action?: AssistantAction | null
        error?: string
      }
      if (!response.ok) throw new Error(data.error)

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.message ?? 'How can I help?' },
      ])
      setPendingAction(data.action ?? null)
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error && error.message
              ? error.message
              : 'The assistant is temporarily unavailable.',
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
      const data = (await response.json().catch(() => ({}))) as {
        task?: { title: string }
        event?: { title: string }
        note?: { title: string }
        transaction?: { amount: number; type: string }
        error?: string
      }
      if (!response.ok) throw new Error(data.error)

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: (() => {
            switch (pendingAction.type) {
              case 'create_event':
                return `Added “${data.event?.title ?? pendingAction.title}” to Calendar.`
              case 'create_note':
                return `Saved “${data.note?.title ?? pendingAction.title}” in Notes.`
              case 'create_transaction':
                return `Recorded ${data.transaction?.type ?? pendingAction.transactionType} of ₱${(data.transaction?.amount ?? pendingAction.amount).toLocaleString()}.`
              default:
                return `Created “${data.task?.title ?? pendingAction.title}” in Tasks.`
            }
          })(),
        },
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
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-card/70 shadow-[0_24px_80px_rgba(15,23,18,0.16)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_38%)]">
      <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <NexMascot
            iconStyle={identity.iconStyle}
            accentColor={identity.accentColor}
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-text-primary">
              {identity.assistantName}
            </h1>
            <p className="truncate text-xs text-text-tertiary">
              Vertex AI · connected to your workspace
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1 text-[11px] font-medium text-text-tertiary sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-pos" /> Confirm before changes
        </span>
      </header>

      <div
        className="flex-1 overflow-y-auto px-3 py-5 sm:px-6"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-primary-500 text-[#07110b]'
                    : 'rounded-bl-md border border-border-subtle bg-bg-app text-text-primary'
                }`}
              >
                <span className="sr-only">
                  {message.role === 'user' ? 'You' : identity.assistantName}:{' '}
                </span>
                {message.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="rounded-xl border border-border-subtle bg-bg-app px-3 py-3 text-left text-xs leading-relaxed text-text-secondary transition-colors hover:border-primary-500/40 hover:text-text-primary"
                >
                  <Sparkles className="mb-2 h-4 w-4 text-primary-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary-500" />
              Checking your workspace…
            </div>
          )}

          {pendingAction && (
            <div className="rounded-2xl border border-primary-500/30 bg-primary-500/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                Confirmation required
              </p>
              <p className="mt-2 text-sm font-semibold text-text-primary">
                {pendingAction.type === 'create_event' &&
                  `Add calendar event: ${pendingAction.title}`}
                {pendingAction.type === 'create_task' &&
                  `Create task: ${pendingAction.title}`}
                {pendingAction.type === 'create_note' &&
                  `Save note: ${pendingAction.title}`}
                {pendingAction.type === 'create_transaction' &&
                  `Record ${pendingAction.transactionType.toLowerCase()}: ₱${pendingAction.amount.toLocaleString()}`}
              </p>
              {'description' in pendingAction && pendingAction.description && (
                <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                  {pendingAction.description}
                </p>
              )}
              {pendingAction.type === 'create_note' && pendingAction.content && (
                <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                  {pendingAction.content}
                </p>
              )}
              {pendingAction.type === 'create_event' ? (
                <p className="mt-2 text-[11px] font-medium text-text-tertiary">
                  {pendingAction.date} · {pendingAction.startTime}–{pendingAction.endTime}
                </p>
              ) : pendingAction.type === 'create_task' ? (
                <p className="mt-2 text-[11px] font-medium text-text-tertiary">
                  Priority: {pendingAction.priority}
                </p>
              ) : pendingAction.type === 'create_transaction' ? (
                <p className="mt-2 text-[11px] font-medium text-text-tertiary">
                  Date: {pendingAction.date}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 min-[400px]:flex-row">
                <button
                  type="button"
                  onClick={() => void confirmAction()}
                  disabled={actionLoading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-xs font-semibold text-[#07110b] disabled:opacity-60"
                >
                  {actionLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {pendingAction.type === 'create_event' && 'Confirm event'}
                  {pendingAction.type === 'create_task' && 'Confirm task'}
                  {pendingAction.type === 'create_note' && 'Confirm note'}
                  {pendingAction.type === 'create_transaction' &&
                    'Confirm finance entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-subtle px-4 text-xs font-semibold text-text-secondary"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border-subtle p-3 sm:p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border-subtle bg-bg-app p-2 focus-within:border-primary-500/50">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendMessage(input)
              }
            }}
            rows={1}
            maxLength={2_000}
            aria-label={`Message ${identity.assistantName}`}
            placeholder={`Ask ${identity.assistantName} about ARKO or create workspace data…`}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-[#07110b] transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-text-secondary">
          AI can make mistakes. Review every proposed action before confirming.
        </p>
      </form>
    </div>
  )
}
