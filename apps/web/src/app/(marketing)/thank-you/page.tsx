import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '../_components/Breadcrumbs'
import ThankYouTracker from '../_components/ThankYouTracker'

const TITLE = 'Thank you — Arko'
const DESCRIPTION =
  'Your message reached Arko. We reply within 24 hours — usually the same working day.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/thank-you' },
  robots: { index: false, follow: true },
}

const NEXT_STEPS = [
  { label: 'See our projects', href: '/projects' },
  { label: 'Read a case study', href: '/projects/client-document-workflow' },
  { label: 'Back to home', href: '/' },
]

export default function ThankYouPage() {
  return (
    <div id="top" className="bg-ink text-white">
      <ThankYouTracker />
      <section
        data-bg="light"
        className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-acid px-6 py-32 text-ink md:px-10"
      >
        <div className="project-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto w-full max-w-[90rem]">
          <Breadcrumbs
            className="text-ink"
            items={[{ label: 'Home', href: '/' }, { label: 'Thank you' }]}
          />
          <p className="eyebrow mt-10 text-ink/60">Message received</p>
          <h1 className="display mt-4 text-[clamp(3.5rem,12vw,10rem)] leading-[0.85]">
            Thank you.
          </h1>
          <p className="mt-8 max-w-xl text-lg font-semibold leading-relaxed text-ink/75 md:text-2xl">
            Your brief is in. We read every message and{' '}
            <span className="bg-ink px-2 text-acid">reply within 24 hours</span>{' '}
            — usually the same working day.
          </p>
          <p className="mono mt-6 text-xs font-bold uppercase tracking-[0.16em] text-ink/50">
            Need us sooner? Email{' '}
            <a
              href="mailto:arkodevph@gmail.com"
              className="underline decoration-2 underline-offset-4"
            >
              arkodevph@gmail.com
            </a>
          </p>

          <nav
            aria-label="Next steps"
            className="mt-12 flex flex-wrap items-center gap-3"
          >
            {NEXT_STEPS.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className="mono border-4 border-ink bg-ink px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-acid transition-transform hover:-translate-y-1"
              >
                {step.label} →
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  )
}
