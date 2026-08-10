"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Bot, Globe2, Smartphone, Workflow } from "lucide-react";
import { useRef } from "react";
import type { LandingContent } from "../../../lib/landing/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const serviceIcons = [Globe2, Smartphone, Workflow, Bot];

function WorkModel({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="work-model work-browser" aria-hidden="true">
        <div className="work-browser-bar"><i /><i /><i /><span>arko.studio/project</span></div>
        <div className="work-browser-body">
          <div><small>Built to convert</small><strong>Clear idea.<br />Sharp launch.</strong><b>Start a project →</b></div>
          <span className="work-browser-shape">A</span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="work-model work-phone-scene" aria-hidden="true">
        <div className="work-phone work-phone-back"><span /><span /><span /></div>
        <div className="work-phone work-phone-front">
          <small>09:41</small><strong>Your day</strong>
          <div className="work-phone-chart"><i /><i /><i /><i /></div>
          <div className="work-phone-nav"><i /><i /><i /></div>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="work-model work-flow" aria-hidden="true">
        <span className="work-flow-node">FORM</span><i />
        <span className="work-flow-node work-flow-node-acid">SORT</span><i />
        <span className="work-flow-node">DONE</span>
        <b className="work-flow-pulse" />
      </div>
    );
  }

  return (
    <div className="work-model work-ai" aria-hidden="true">
      <div className="work-ai-orb"><span>AI</span></div>
      <div className="work-ai-message work-ai-message-one">Find the useful answer</div>
      <div className="work-ai-message work-ai-message-two">Ready in your product.</div>
    </div>
  );
}

export default function ScrollWork({
  eyebrow,
  heading,
  subtitle,
  ctaLabel,
  cards: WORK,
}: LandingContent["work"]) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cornerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      // Animate each card on scroll
      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          end: "top 40%",
          scrub: 0.8,
          onUpdate(self) {
            const p = Math.min(1, self.progress * 1.2);
            el.style.opacity = String(p);
            el.style.transform = `translateY(${(1 - p) * 60}px) scale(${0.92 + p * 0.08})`;
          },
        });
      });

      // Decorative corner brackets animate in
      cornerRefs.current.forEach((el) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          end: "top 40%",
          scrub: 0.5,
          onUpdate(self) {
            el.style.opacity = String(Math.min(1, self.progress * 2));
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative bg-ink px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="mb-16 md:mb-20">
          <p className="mono text-sm font-semibold tracking-[0.2em] text-acid/50">
            {eyebrow}
          </p>
          <h2 className="display mt-2 text-[clamp(3rem,12vw,10rem)] leading-none text-acid">
            {heading}
          </h2>
          <p className="mono mt-4 text-sm text-white/40">
            {subtitle}
          </p>
        </div>

        {/* service models */}
        <div className="grid gap-4 md:grid-cols-2">
          {WORK.map((item, i) => (
            <div
              key={item.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="work-card group relative overflow-hidden border-2 border-white/15 bg-ink-soft transition-colors duration-300 hover:border-acid"
              style={{ opacity: 0, transform: "translateY(60px) scale(0.92)" }}
            >
              <div className="relative h-64 overflow-hidden border-b-2 border-white/15 bg-acid group-hover:border-acid md:h-72">
                <div className="project-grid absolute inset-0 text-ink/10" />
                <span className="display absolute left-5 top-4 text-sm text-ink/45">0{i + 1} / 04</span>
                <WorkModel index={i} />
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="eyebrow flex items-center gap-2 text-acid">
                    {(() => { const Icon = serviceIcons[i] ?? Globe2; return <Icon className="h-4 w-4" />; })()}
                    {item.kind}
                  </div>
                  <div
                    ref={(el) => { cornerRefs.current[i] = el; }}
                    className="grid h-10 w-10 place-items-center border border-white/15 text-white/40 transition-all duration-200 group-hover:border-acid group-hover:bg-acid group-hover:text-ink"
                    style={{ opacity: 0 }}
                  ><ArrowUpRight className="h-4 w-4" /></div>
                </div>
                <h3 className="display mt-5 text-3xl text-white md:text-4xl">{item.title}</h3>
                <p className="mt-3 max-w-md text-base font-medium leading-relaxed text-white/60">{item.copy}</p>
                <div className="mono mt-6 flex flex-wrap gap-2">
                  {item.tags.map((tag) => <span key={tag} className="border border-white/15 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/45 transition-colors group-hover:border-acid/40 group-hover:text-acid">{tag}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* bottom CTA */}
        <div className="mono mt-16 flex items-center gap-4 text-sm font-semibold tracking-wider text-white/30">
          <span className="h-[2px] flex-1 bg-white/10" />
          <a href="#contact" className="border-2 border-acid px-5 py-3 text-acid transition-colors hover:bg-acid hover:text-ink">
            {ctaLabel} <span aria-hidden>→</span>
          </a>
          <span className="h-[2px] flex-1 bg-white/10" />
        </div>
      </div>
    </section>
  );
}
