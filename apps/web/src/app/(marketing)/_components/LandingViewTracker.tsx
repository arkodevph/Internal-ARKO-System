'use client'

import { useEffect } from 'react'

const SESSION_KEY_PREFIX = 'arko_landing_viewed:'

export default function LandingViewTracker() {
  useEffect(() => {
    const sessionKey = `${SESSION_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`
    try {
      if (sessionStorage.getItem(sessionKey)) return
      sessionStorage.setItem(sessionKey, '1')
    } catch {
      // Tracking is optional when browser storage is unavailable.
    }

    void fetch('/api/landing/view', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).catch(() => {
      try {
        sessionStorage.removeItem(sessionKey)
      } catch {
        // A future page load can retry when browser storage is unavailable.
      }
    })
  }, [])

  return null
}
