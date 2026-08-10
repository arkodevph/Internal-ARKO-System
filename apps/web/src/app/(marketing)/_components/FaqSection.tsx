import Link from 'next/link'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How soon will you reply?',
    a: 'We reply within 24 hours. Send a short brief and we will come back with next steps, questions, or a call time — usually the same working day.',
  },
  {
    q: 'What do you build?',
    a: 'Web and mobile products, plus the automation and AI that make them run on their own. Most work falls into websites, cross-platform apps, automation pipelines, and AI features.',
  },
  {
    q: 'How much does a project cost?',
    a: 'It depends on scope. Share a rough budget in the brief and we will tell you honestly what is realistic — and where the money is best spent — before any commitment.',
  },
  {
    q: 'How long does a project take?',
    a: 'A focused website ships in a few weeks; larger apps and systems run longer. We agree on milestones up front so you always know what is landing and when.',
  },
  {
    q: 'Do you work with clients outside the Philippines?',
    a: 'Yes. We are based in the Philippines and work with clients worldwide, async-first across time zones.',
  },
  {
    q: 'Who owns the code and the work?',
    a: 'You do. On handoff, the code, accounts, and assets are yours — no lock-in.',
  },
]

export default function FaqSection() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-t-4 border-acid bg-ink px-6 py-24 text-white md:px-10 md:py-32"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-acid">FAQ</p>
          <h2
            id="faq-heading"
            className="display mt-4 text-[clamp(3rem,8vw,7rem)]"
          >
            Answers,
            <br />
            up front.
          </h2>
          <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-white/60">
            Still unsure about something?{' '}
            <Link
              href="/#contact"
              className="text-acid underline underline-offset-4"
            >
              Ask us directly
            </Link>{' '}
            — we reply within 24 hours.
          </p>
        </div>

        <div className="border-t-2 border-white/15">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group border-b-2 border-white/15"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                <h3 className="display text-2xl leading-tight md:text-3xl">
                  {item.q}
                </h3>
                <span
                  aria-hidden
                  className="mono shrink-0 text-2xl text-acid transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-7 text-base font-medium leading-relaxed text-white/60">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
