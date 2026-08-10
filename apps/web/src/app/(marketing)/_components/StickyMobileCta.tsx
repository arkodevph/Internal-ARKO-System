'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StickyMobileCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after the user scrolls past the hero, hide when the contact
    // section (the CTA's own destination) is on screen.
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const contact = document.getElementById('contact')
    let observer: IntersectionObserver | undefined
    if (contact) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(false)
        },
        { threshold: 0 },
      )
      observer.observe(contact)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [])

  return (
    <div
      className={`fixed inset-x-3 z-40 transition-all duration-300 md:hidden ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        href="/#contact"
        className="mono flex min-h-12 items-center justify-center gap-2 border-2 border-ink bg-acid px-5 text-xs font-bold uppercase tracking-[0.16em] text-ink shadow-[4px_4px_0_#0a0a0a]"
      >
        Start a project — reply in 24h
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}
