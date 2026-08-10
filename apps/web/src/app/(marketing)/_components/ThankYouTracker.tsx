'use client'

import { useEffect } from 'react'

export default function ThankYouTracker() {
  useEffect(() => {
    window.gtag?.('event', 'generate_lead', {
      event_category: 'contact',
      event_label: 'thank_you',
    })
  }, [])

  return null
}
