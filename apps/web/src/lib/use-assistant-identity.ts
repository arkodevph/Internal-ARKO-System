'use client'

import { useEffect, useState } from 'react'

export type AssistantIdentity = {
  assistantName: string
  iconStyle: 'BOT' | 'SPARK' | 'ORBIT' | 'BRAIN'
  accentColor: '#22C55E' | '#22D3EE' | '#A78BFA' | '#FBBF24'
  greeting: string
}

export const DEFAULT_ASSISTANT_IDENTITY: AssistantIdentity = {
  assistantName: 'NEX',
  iconStyle: 'BOT',
  accentColor: '#22C55E',
  greeting:
    'Hey, y’all! I’m NEX, your ARKO operations guide. Tell me what needs sorting, and I’ll line it up for your approval before changing anything.',
}

let cachedIdentity: AssistantIdentity | null = null
let identityRequest: Promise<AssistantIdentity> | null = null
const IDENTITY_EVENT = 'arko:assistant-identity'

export function publishAssistantIdentity(identity: AssistantIdentity) {
  cachedIdentity = identity
  window.dispatchEvent(
    new CustomEvent<AssistantIdentity>(IDENTITY_EVENT, { detail: identity }),
  )
}

function loadIdentity() {
  if (cachedIdentity) return Promise.resolve(cachedIdentity)
  if (!identityRequest) {
    identityRequest = fetch('/api/assistant/identity')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load assistant identity')
        return (await response.json()) as AssistantIdentity
      })
      .then((identity) => {
        cachedIdentity = identity
        return identity
      })
      .finally(() => {
        identityRequest = null
      })
  }
  return identityRequest
}

export function useAssistantIdentity() {
  const [identity, setIdentity] = useState(
    cachedIdentity ?? DEFAULT_ASSISTANT_IDENTITY,
  )

  useEffect(() => {
    let active = true
    const handleIdentity = (event: Event) => {
      setIdentity((event as CustomEvent<AssistantIdentity>).detail)
    }
    window.addEventListener(IDENTITY_EVENT, handleIdentity)
    void loadIdentity()
      .then((value) => {
        if (active) setIdentity(value)
      })
      .catch(() => undefined)
    return () => {
      active = false
      window.removeEventListener(IDENTITY_EVENT, handleIdentity)
    }
  }, [])

  return identity
}
