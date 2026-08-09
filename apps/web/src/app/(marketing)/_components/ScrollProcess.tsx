'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import type { LandingContent } from '../../../lib/landing/content'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function ScrollProcess({
  eyebrow,
  heading,
  subtitle,
  ctaLabel,
  steps: STEPS,
}: LandingContent['process']) {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const contentRefs = useRef<(HTMLDetailsElement | null)[]>([])

  useGSAP(
    () => {
      const section = sectionRef.current
      const line = lineRef.current
      if (!section || !line) return

      // Animate the connector line from 0 to 100% height
      ScrollTrigger.create({
        trigger: section,
        start: 'top 20%',
        end: 'bottom 40%',
        scrub: 1,
        onUpdate(self) {
          line.style.height = `${self.progress * 100}%`
        },
      })

      // Animate each step in sequence
      stepRefs.current.forEach((el, i) => {
        if (!el) return
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          end: 'top 35%',
          scrub: 0.5,
          onUpdate(self) {
            const p = self.progress
            el.style.opacity = String(Math.min(1, p * 1.5))
            el.style.transform = `translateY(${(1 - p) * 40}px)`
          },
        })
      })
    },
    { scope: sectionRef },
  )

  return (
    <section id="process" ref={sectionRef} data-bg="light" className="relative bg-acid px-6 py-24 text-ink md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="mb-20">
          <p className="mono text-sm font-semibold tracking-[0.2em] text-ink/40">{eyebrow}</p>
          <h2 className="display mt-2 text-[clamp(2.5rem,9vw,7rem)] leading-none">
            {heading}
          </h2>
          <p className="mono mt-4 text-sm text-ink/50">{subtitle}</p>
        </div>

        {/* timeline */}
        <div className="relative">
          {/* vertical connector line — drawn by ScrollTrigger */}
          <div className="absolute left-[1.125rem] top-0 h-full w-[2px] bg-ink/10 md:left-8">
            <div
              ref={lineRef}
              className="w-full bg-ink transition-none"
              style={{ height: '0%' }}
            />
          </div>

          {/* steps */}
          <div className="relative space-y-16 md:space-y-24">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                ref={(el) => { stepRefs.current[i] = el }}
                className="relative grid gap-6 md:grid-cols-[auto_1fr] md:gap-10"
                style={{ opacity: 0, transform: 'translateY(40px)' }}
              >
                {/* step indicator */}
                <div className="relative z-10 flex items-start gap-4 md:flex-col">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-ink bg-acid md:h-16 md:w-16">
                    <span className="display text-sm text-ink md:text-2xl">{step.n}</span>
                  </div>

                  {/* icon */}
                  <span className="display mt-1 text-2xl text-ink/20 md:mt-3 md:text-3xl">
                    {step.icon}
                  </span>
                </div>

                {/* content */}
                <div className="min-w-0">
                  <details
                    ref={(el) => { contentRefs.current[i] = el }}
                    className="group cursor-pointer border-4 border-ink bg-paper transition-colors hover:bg-white"
                  >
                    <summary className="flex items-center gap-4 px-6 py-5 md:px-10 md:py-7">
                      <h3 className="display flex-1 text-2xl md:text-4xl">{step.title}</h3>
                      <span className="mono text-sm font-bold tracking-wider text-ink/40">+info</span>
                      <span className="text-2xl font-bold transition-transform duration-500 group-open:rotate-45 md:text-3xl">
                        +
                      </span>
                    </summary>
                    <div className="border-t-4 border-ink px-6 pb-8 pt-6 md:px-10 md:pb-10 md:pt-8">
                      <p className="text-base font-medium leading-relaxed text-ink/80 md:text-lg">
                        {step.body}
                      </p>
                      <div className="mono mt-5 border-l-4 border-ink/20 pl-4 text-sm leading-relaxed text-ink/60">
                        {step.detail}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* final CTA */}
        <div className="mono mt-20 flex items-center gap-4 text-sm font-semibold tracking-wider text-ink/40">
          <span className="h-[2px] flex-1 bg-ink/10" />
          <a href="#contact" className="hover:text-ink transition-colors">
            {ctaLabel}
          </a>
          <span className="h-[2px] flex-1 bg-ink/10" />
        </div>
      </div>
    </section>
  )
}
