'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from 'motion/react'
import { ArrowUpRight, GripHorizontal, Send, X } from 'lucide-react'
import { NexMascot } from '../../../components/nex-mascot'
import { useAssistantIdentity } from '../../../lib/use-assistant-identity'
import {
  AssistantThinking,
  ProgressiveResponse,
} from '../../../components/assistant-response'
import { isNearChatBottom } from '../../../lib/chat-scroll'

type Message = {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
}

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const identity = useAssistantIdentity()
  const reduceMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const followLatestRef = useRef(true)
  const dragControls = useDragControls()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const list = messageListRef.current
    if (!list) return
    followLatestRef.current = true
    list.scrollTo({
      top: list.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [messages, loading, reduceMotion])

  useEffect(() => {
    const list = messageListRef.current
    const content = list?.firstElementChild
    if (!list || !content || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (followLatestRef.current)
        list.scrollTo({ top: list.scrollHeight, behavior: 'auto' })
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [open])

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
    setLoading(true)

    try {
      const response = await fetch('/api/assistant/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-8) }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        message?: string
        suggestions?: string[]
        error?: string
      }
      if (!response.ok) throw new Error(data.error)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.message ?? 'Ask me about ARKO.',
          suggestions: data.suggestions,
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'I could not connect just now. You can reach ARKO at contact@arkodevph.com.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void sendMessage(input)
  }

  return (
    <aside
      className="floating-nex-shell fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 z-[45] md:bottom-5 md:right-5"
      aria-label={`${identity.assistantName} assistant`}
    >
      <AnimatePresence>
        {open && (
          <motion.section
            id="public-nex-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            role="dialog"
            aria-modal="false"
            aria-labelledby="public-nex-title"
            className="floating-nex-panel nex-terminal-panel absolute bottom-[4.5rem] right-0 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden text-white"
          >
            <div className="h-1 shrink-0 bg-acid" />
            <header
              className="nex-terminal-header relative flex cursor-grab touch-none items-center justify-between px-4 py-3 active:cursor-grabbing"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(184,255,46,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(184,255,46,.8)_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="relative flex items-center gap-3">
                <NexMascot
                  iconStyle={identity.iconStyle}
                  accentColor="#B8FF2E"
                  size="md"
                />
                <div>
                  <h2
                    id="public-nex-title"
                    className="display text-xl text-white"
                  >
                    {identity.assistantName}
                  </h2>
                  <p className="mono text-[9px] uppercase tracking-[0.18em] text-acid">
                    Arko studio signal
                  </p>
                </div>
              </div>
              <GripHorizontal
                className="relative ml-auto mr-2 h-4 w-4 text-white/30"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                onPointerDown={(event) => event.stopPropagation()}
                className="relative grid h-11 w-11 place-items-center border border-white/15 text-white/60 transition-colors hover:border-acid hover:text-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div
              ref={messageListRef}
              onScroll={(event) => {
                followLatestRef.current = isNearChatBottom(event.currentTarget)
              }}
              className="nex-terminal-screen min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
              role="log"
              aria-label="NEX conversation"
              aria-live="polite"
            >
              <div className="flex min-h-full flex-col gap-3">
                {messages.length === 0 && (
                  <div className="border-l-2 border-acid bg-acid/[0.06] p-4">
                    <p className="mono text-[9px] font-bold uppercase tracking-[0.18em] text-acid">
                      Signal connected
                    </p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">
                      Ask about ARKO, what we build, project timing, pricing, or
                      how to start.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        'What do you build?',
                        'How long does a project take?',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void sendMessage(suggestion)}
                          className="min-h-10 rounded-full border border-white/15 bg-black/30 px-3 text-left text-[11px] text-white/65 transition-colors hover:border-acid hover:text-acid"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={message.role === 'user' ? 'ml-8' : 'mr-8'}
                  >
                    <p className="mono mb-1 text-[8px] uppercase tracking-[0.16em] text-white/35">
                      {message.role === 'user'
                        ? 'You / input'
                        : `${identity.assistantName} / reply`}
                    </p>
                    <div
                      className={
                        message.role === 'user'
                          ? 'border-r-2 border-acid bg-acid px-3 py-2.5 text-sm font-medium leading-relaxed text-ink'
                          : 'border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-white/80'
                      }
                    >
                      {message.role === 'assistant' ? (
                        <ProgressiveResponse
                          text={message.content}
                          animate={index === messages.length - 1 && !loading}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.role === 'assistant' && message.suggestions && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.suggestions.map(
                          (suggestion, suggestionIndex) => (
                            <motion.button
                              key={suggestion}
                              type="button"
                              initial={
                                reduceMotion
                                  ? false
                                  : { opacity: 0, y: 6, scale: 0.96 }
                              }
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                delay: reduceMotion
                                  ? 0
                                  : suggestionIndex * 0.05,
                              }}
                              onClick={() => void sendMessage(suggestion)}
                              disabled={loading}
                              className="rounded-full border border-acid/45 bg-acid/[0.08] px-3 py-2 text-[10px] font-semibold text-acid shadow-[0_0_14px_rgba(184,255,46,.08)] transition-colors hover:bg-acid hover:text-ink disabled:opacity-40"
                            >
                              {suggestion}
                            </motion.button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="mr-8 rounded-2xl rounded-bl-md border border-white/15 bg-white/[0.04] px-4 py-3 text-white/60">
                    <AssistantThinking label="Thinking" />
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="nex-terminal-controls p-3">
              <label
                htmlFor="public-nex-input"
                className="mono mb-2 block text-[8px] uppercase tracking-[0.18em] text-white/40"
              >
                Ask the studio
              </label>
              <div className="flex items-center rounded-full border border-white/20 bg-black/45 pl-1 focus-within:border-acid">
                <input
                  ref={inputRef}
                  id="public-nex-input"
                  className="floating-nex-input h-12 min-w-0 flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-white/30"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={500}
                  placeholder="Type your question…"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="mr-1 grid h-10 w-10 place-items-center rounded-full bg-acid text-ink disabled:opacity-35"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <a
                href="mailto:contact@arkodevph.com"
                className="mono mt-2 inline-flex items-center gap-1 text-[8px] uppercase tracking-[0.15em] text-white/35 hover:text-acid"
              >
                Human contact <ArrowUpRight className="h-3 w-3" />
              </a>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((current) => !current)}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        aria-expanded={open}
        aria-controls="public-nex-panel"
        aria-label={`${open ? 'Close' : 'Open'} ${identity.assistantName} assistant`}
        className="floating-nex-trigger nex-terminal-trigger group relative flex h-16 items-center rounded-full pl-2 pr-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-acid" />
        <span className="relative">
          {!reduceMotion && (
            <span className="absolute inset-0 animate-ping border border-acid/40" />
          )}
          <NexMascot
            iconStyle={identity.iconStyle}
            accentColor="#B8FF2E"
            size="md"
          />
        </span>
        <span className="ml-3 text-left">
          <span className="display block text-base leading-none">
            Ask {identity.assistantName}
          </span>
          <span className="mono mt-1 block text-[8px] uppercase tracking-[0.17em] text-acid">
            Live studio signal
          </span>
        </span>
      </motion.button>
    </aside>
  )
}
