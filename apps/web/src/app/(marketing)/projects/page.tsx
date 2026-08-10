import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProjectGallery from "./ProjectGallery";
import { getLandingContent } from "../../../lib/landing/get-content";

const TITLE = "Projects — Arko Software Studio";
const DESCRIPTION =
  "Selected websites and digital products designed and built by Arko.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    url: "/projects",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function ProjectsPage() {
  const { projects } = await getLandingContent();
  return (
    <div id="top" className="min-h-screen bg-ink pb-16 text-white md:pb-0">
      <section
        data-bg="light"
        className="relative overflow-hidden bg-acid px-4 pb-8 pt-24 text-ink md:px-10 md:pb-28 md:pt-44"
      >
        <div className="project-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto grid max-w-[90rem] items-center gap-5 md:gap-10 lg:grid-cols-[1fr_.8fr]">
          <div className="relative z-10">
            <p className="eyebrow text-ink/60">{projects.eyebrow}</p>
            <h1 className="display mt-3 text-[3.3rem] leading-[0.84] md:mt-5 md:text-[clamp(4rem,10vw,9rem)]">{projects.heading}</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-ink/70 md:mt-10 md:text-2xl">{projects.intro}</p>
            <div className="mono mt-6 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 text-[0.5rem] font-bold uppercase tracking-wider md:mt-10 md:flex-wrap md:gap-2 md:text-[0.58rem]">
              <span className="border-2 border-ink bg-ink px-3 py-2 text-acid">{projects.items.length} live builds</span>
              <span className="border-2 border-ink px-3 py-2">Click to explore</span>
              <span className="border-2 border-ink px-3 py-2">Real websites</span>
            </div>
          </div>
          <div className="project-hero-model relative mx-auto aspect-[4/3] w-full max-w-[20rem] md:aspect-square md:max-w-[34rem]" aria-hidden>
            <div className="absolute inset-[11%] border-2 border-dashed border-ink/20" />
            <Image src="/projects/models/project-browser-halftone.png" alt="" fill priority sizes="(min-width:1024px) 42vw, 80vw" className="relative z-10 object-contain p-[5%]" />
            <span className="mono absolute bottom-[12%] right-[4%] z-20 border-2 border-ink bg-ink px-3 py-2 text-[0.55rem] font-bold text-acid">LIVE / 09</span>
          </div>
        </div>
      </section>

      <section className="py-4 md:px-10 md:py-16">
        <ProjectGallery projects={projects.items} />
      </section>

      <section
        data-bg="light"
        className="border-t-4 border-ink bg-acid px-4 py-14 text-ink md:px-10 md:py-28"
      >
        <div className="mx-auto flex max-w-[90rem] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-ink/55">{projects.ctaEyebrow}</p>
            <h2 className="display mt-4 text-[clamp(3rem,9vw,7rem)]">
              {projects.ctaHeading}
            </h2>
          </div>
          <Link
            href="/#contact"
            className="mono border-4 border-ink bg-ink px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-acid transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-ink/30"
          >
            {projects.ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
