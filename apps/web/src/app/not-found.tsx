import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found - Arko',
  description: 'That page does not exist. Head back to Arko or explore our work.',
}

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Start a project', href: '/#contact' },
]

export default function NotFound() {
  return (
    <div className="landing-root">
      <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-acid px-6 py-24 text-center text-ink">
        <p className="eyebrow text-ink/60">Error 404</p>
        <p className="display mt-4 text-[clamp(6rem,28vw,20rem)] leading-none">
          404
        </p>
        <h1 className="display mt-2 text-[clamp(2rem,7vw,4rem)]">
          This page shipped elsewhere.
        </h1>
        <p className="mt-6 max-w-md text-base font-medium text-ink/70 md:text-lg">
          The link is broken or the page moved. Let&apos;s get you back to
          something that works.
        </p>
        <nav
          aria-label="Helpful links"
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mono border-4 border-ink bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-acid transition-transform hover:-translate-y-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
