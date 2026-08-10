'use client'

import { useEffect } from 'react'

const SESSION_KEY = 'arko_landing_viewed'

export default function LandingViewTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // Tracking is optional when browser storage is unavailable.
    }

    void fetch('/api/landing/view', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    })
  }, [])

  return null
}
