'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import type { LandingContent } from '../../../lib/landing/content'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const DELIVERABLES = [
  ['Scope', 'Roadmap', 'User flows'],
  ['Live prototype', 'Weekly demo', 'Production code'],
  ['Integrations', 'AI workflows', 'Background jobs'],
  ['Documentation', 'Training', 'Ongoing support'],
]

function ProcessVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 320 220" role="img" aria-label="Discovery radar mapping opportunities" className="h-auto w-full max-w-sm">
        <g fill="none" stroke="currentColor">
          <circle cx="160" cy="110" r="78" strokeWidth="2" opacity=".2" />
          <circle cx="160" cy="110" r="52" strokeWidth="2" opacity=".35" />
          <circle cx="160" cy="110" r="25" strokeWidth="3" />
          <path d="M160 110 259 48M160 110 75 165M160 110l12-91" strokeWidth="2" strokeDasharray="5 6" />
        </g>
        <g fill="currentColor">
          <rect x="250" y="39" width="18" height="18" transform="rotate(45 259 48)" />
          <circle cx="75" cy="165" r="10" />
          <rect x="163" y="10" width="18" height="18" />
          <circle cx="160" cy="110" r="8" />
        </g>
        <text x="20" y="28" className="fill-current font-mono text-[10px] font-bold">SIGNAL / 01</text>
        <text x="224" y="204" className="fill-current font-mono text-[10px] font-bold">MAP → ALIGN</text>
      </svg>
    )
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 320 220" role="img" aria-label="Product interface moving from design to working build" className="h-auto w-full max-w-sm">
        <path d="M53 41h214v138H53z" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M53 68h214M81 41v138" stroke="currentColor" strokeWidth="3" />
        <circle cx="66" cy="55" r="4" fill="currentColor" />
        <g fill="currentColor">
          <rect x="98" y="86" width="70" height="39" />
          <rect x="181" y="86" width="68" height="14" opacity=".3" />
          <rect x="181" y="108" width="48" height="8" opacity=".3" />
          <rect x="98" y="139" width="151" height="22" opacity=".18" />
          <rect x="60" y="82" width="14" height="14" />
          <rect x="60" y="106" width="14" height="14" opacity=".35" />
          <rect x="60" y="130" width="14" height="14" opacity=".35" />
        </g>
        <path d="m231 17 10 13 17-22" fill="none" stroke="currentColor" strokeWidth="6" />
        <text x="20" y="205" className="fill-current font-mono text-[10px] font-bold">DESIGN + ENGINEERING / SAME LOOP</text>
      </svg>
    )
  }

  if (index === 2) {
    const nodes = [[54, 55], [54, 165], [160, 44], [160, 110], [160, 176], [266, 72], [266, 150]]
    return (
      <svg viewBox="0 0 320 220" role="img" aria-label="Connected automation and AI workflow" className="h-auto w-full max-w-sm">
        <g fill="none" stroke="currentColor" strokeWidth="3" opacity=".42">
          <path d="M54 55 160 44l106 28M54 55l106 55 106-38M54 165l106-55 106 40M54 165l106 11 106-26" />
        </g>
        {nodes.map(([x, y], i) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <rect x="-15" y="-15" width="30" height="30" fill={i === 3 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="3" transform="rotate(45)" />
            {i === 3 && <circle r="5" className="fill-acid" />}
          </g>
        ))}
        <path d="M112 110h96" stroke="currentColor" strokeWidth="3" strokeDasharray="8 6" />
        <text x="20" y="27" className="fill-current font-mono text-[10px] font-bold">AUTOMATION GRAPH / ACTIVE</text>
        <text x="218" y="205" className="fill-current font-mono text-[10px] font-bold">24 / 7</text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 320 220" role="img" aria-label="Documented product package ready for handover" className="h-auto w-full max-w-sm">
      <path d="m160 29 84 43v86l-84 43-84-43V72Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="m76 72 84 44 84-44M160 116v85M119 51l84 44" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="m130 137 22 22 44-55" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="square" />
      <g fill="currentColor">
        <rect x="19" y="45" width="38" height="6" />
        <rect x="19" y="57" width="24" height="6" opacity=".35" />
        <rect x="262" y="169" width="39" height="6" />
        <rect x="276" y="181" width="25" height="6" opacity=".35" />
      </g>
      <text x="20" y="27" className="fill-current font-mono text-[10px] font-bold">OWNERSHIP / 100%</text>
    </svg>
  )
}

export default function ScrollProcess({
  eyebrow,
  heading,
  subtitle,
  ctaLabel,
  steps,
}: LandingContent['process']) {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useGSAP(
    () => {
      cardRefs.current.forEach((card, index) => {
        if (!card) return
        gsap.fromTo(
          card,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: index % 2 * 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          },
        )
      })
    },
    { scope: sectionRef },
  )

  return (
    <section id="process" ref={sectionRef} data-bg="light" className="relative overflow-hidden bg-acid px-4 py-20 text-ink sm:px-6 md:px-10 md:py-32">
      <div className="pointer-events-none absolute inset-0 opacity-[.16]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 border-y-4 border-ink py-8 md:grid-cols-[1fr_auto] md:items-end md:py-12">
          <div>
            <p className="mono text-xs font-bold uppercase tracking-[0.22em] text-ink/55">{eyebrow}</p>
            <h2 className="display mt-3 max-w-4xl text-[clamp(3.5rem,10vw,8.5rem)] leading-[.78]">{heading}</h2>
          </div>
          <p className="mono max-w-sm text-sm font-semibold leading-relaxed text-ink/65 md:pb-1 md:text-right">{subtitle}</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.n}
              ref={(element) => { cardRefs.current[index] = element }}
              className="group relative overflow-hidden border-4 border-ink bg-paper shadow-[8px_8px_0_#0a0a0a] transition-transform duration-300 hover:-translate-y-1 sm:shadow-[12px_12px_0_#0a0a0a]"
            >
              <div className="grid min-h-full sm:grid-cols-[minmax(10rem,38%)_1fr]">
                <div className="relative flex min-h-56 items-center justify-center overflow-hidden border-b-4 border-ink bg-acid p-5 text-ink sm:min-h-full sm:border-b-0 sm:border-r-4">
                  <div className="absolute left-3 top-3 font-mono text-[.6rem] font-bold tracking-widest text-ink/50">ARKO / {step.n}</div>
                  <ProcessVisual index={index} />
                </div>

                <div className="flex min-w-0 flex-col p-5 sm:p-7 md:p-8">
                  <div className="flex items-start gap-4">
                    <span className="display text-2xl text-ink/25">{step.n}</span>
                    <h3 className="display flex-1 text-3xl leading-none md:text-4xl">{step.title}</h3>
                  </div>
                  <p className="mt-5 text-base font-medium leading-relaxed text-ink/75">{step.body}</p>

                  <div className="mt-6 flex flex-wrap gap-2" aria-label="What you receive">
                    {DELIVERABLES[index]?.map((item) => (
                      <span key={item} className="border-2 border-ink bg-acid px-2.5 py-1 font-mono text-[.65rem] font-bold uppercase tracking-wide">{item}</span>
                    ))}
                  </div>

                  <details className="group/detail mt-6 border-t-2 border-ink/20 pt-4">
                    <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
                      See exactly how it works
                      <span className="flex size-8 items-center justify-center border-2 border-ink text-xl leading-none transition-transform group-open/detail:rotate-45">+</span>
                    </summary>
                    <p className="pt-4 text-sm leading-relaxed text-ink/65">{step.detail}</p>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-4 border-ink bg-ink p-5 text-paper sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-mono text-[.65rem] font-bold uppercase tracking-[.2em] text-acid">No mystery. No lock-in.</p>
            <p className="display mt-2 text-3xl sm:text-4xl">You see progress every week.</p>
          </div>
          <a href="#contact" className="flex min-h-12 items-center justify-center bg-acid px-6 font-mono text-sm font-bold uppercase tracking-wider text-ink transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid">
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
