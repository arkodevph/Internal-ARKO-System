"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { LandingContent } from "../../../lib/landing/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FEATURED_PROJECTS = [
  "Kapet Balay",
  "Yuenansichu Restaurant",
  "Fresh Phones PH",
  "Locus Assembly",
];

const PROJECT_LAYOUT = [
  "md:col-start-1 md:col-span-7 md:row-start-1 md:row-span-7",
  "md:col-start-8 md:col-span-5 md:row-start-2 md:row-span-5",
  "md:col-start-1 md:col-span-5 md:row-start-8 md:row-span-5",
  "md:col-start-6 md:col-span-7 md:row-start-7 md:row-span-6",
];

type ScrollWorkProps = LandingContent["work"] & {
  projects: LandingContent["projects"]["items"];
};

export default function ScrollWork({
  eyebrow,
  projects: allProjects,
}: ScrollWorkProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const projects = FEATURED_PROJECTS.map((title) =>
    allProjects.find((project) => project.title === title),
  ).filter((project): project is NonNullable<typeof project> => Boolean(project));

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const media = gsap.matchMedia();
      media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = cardRefs.current.filter(
          (card): card is HTMLAnchorElement => card !== null,
        );
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.35,
          },
        });

        timeline
          .fromTo(
            cards,
            {
              autoAlpha: 0,
              y: (index) => 120 + index * 45,
              rotate: (index) => (index % 2 === 0 ? -4 : 4),
              scale: 0.86,
            },
            {
              autoAlpha: 1,
              y: 0,
              rotate: 0,
              scale: 1,
              stagger: 0.14,
              duration: 0.5,
            },
          )
          .to(cards, {
            y: (index) => (index < 2 ? -22 : -8),
            stagger: 0.04,
            duration: 0.25,
          });
      });

      return () => media.revert();
    },
    { scope: sectionRef, dependencies: [projects.length] },
  );

  if (projects.length === 0) return null;

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative bg-black text-white md:h-[420vh]"
    >
      <div className="md:sticky md:top-0 md:flex md:h-screen md:items-center md:overflow-hidden md:px-8">
        <div className="mx-auto grid w-full max-w-[90rem] gap-10 px-4 py-20 md:grid-cols-[0.65fr_1.45fr] md:items-center md:gap-12 md:px-0 md:py-0 lg:gap-20">
          <div>
            <p className="eyebrow text-white/40">{eyebrow}</p>
            <h2 className="display mt-3 text-[clamp(3.5rem,7vw,7rem)] leading-[0.82] text-white">
              Websites<br />and digital<br />products
            </h2>
            <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed text-white/45 md:text-base">
              Explore selected websites and digital products designed and developed by Arko.
            </p>
            <Link
              href="/projects"
              className="mono mt-8 inline-flex min-h-11 w-fit items-center border border-acid px-4 text-[0.6rem] font-bold uppercase tracking-wider text-acid transition-colors hover:bg-acid hover:text-ink"
            >
              View all projects <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="relative md:h-[min(72vh,46rem)]">
            <div className="grid h-full gap-4 sm:grid-cols-2 md:grid-cols-12 md:grid-rows-12 md:gap-5">
              {projects.map((project, index) => (
                <a
                  key={project.href}
                  ref={(element) => {
                    cardRefs.current[index] = element;
                  }}
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative min-h-64 overflow-hidden bg-ink-soft text-left shadow-[0_1.5rem_4rem_rgba(0,0,0,0.45)] md:min-h-0 md:will-change-transform ${PROJECT_LAYOUT[index] ?? ""}`}
                >
                  <Image
                    src={project.image}
                    alt={`${project.title} project preview`}
                    fill
                    sizes="(min-width: 768px) 35vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
                  <span className="display absolute left-3 top-3 border border-ink bg-acid px-2 py-1 text-[0.65rem] text-ink">
                    0{index + 1}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div>
                      <p className="eyebrow text-[0.55rem] text-acid">{project.category}</p>
                      <h4 className="display mt-1 text-xl leading-none text-white lg:text-2xl">
                        {project.title}
                      </h4>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-acid bg-black/70 text-acid transition-colors group-hover:bg-acid group-hover:text-ink">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
