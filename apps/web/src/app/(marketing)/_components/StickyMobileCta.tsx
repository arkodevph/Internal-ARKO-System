'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StickyMobileCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after the user scrolls past the hero, hide when the contact
    // section (the CTA's own destination) is on screen.
    const onScroll = () => {
      const hero = document.getElementById('top')
      const contactBounds = document
        .getElementById('contact')
        ?.getBoundingClientRect()
      const pastHero = hero
        ? hero.getBoundingClientRect().bottom <= 0
        : window.scrollY > 600
      const contactVisible =
        contactBounds &&
        contactBounds.top < window.innerHeight &&
        contactBounds.bottom > 0
      setVisible(pastHero && !contactVisible)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      data-mobile-project-cta={visible ? 'visible' : 'hidden'}
      className={`fixed inset-x-3 z-40 transition-all duration-300 lg:hidden ${
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
        Start a project - reply in 24h
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}
