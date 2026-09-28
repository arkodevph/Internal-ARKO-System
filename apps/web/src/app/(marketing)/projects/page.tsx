import type { Metadata } from "next";
import ProjectGallery from "./ProjectGallery";
import ProjectHelmet from "./ProjectHelmet";
import Breadcrumbs from "../_components/Breadcrumbs";
import ContactForm from "../_components/ContactForm";
import { getLandingContent } from "../../../lib/landing/get-content";

const TITLE = "Projects - Arko Software Studio";
const DESCRIPTION =
  "Explore selected websites, product interfaces, and digital systems designed and built by Arko for businesses, founders, and growing teams.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    url: "/projects",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/social-card?v=4",
        width: 1200,
        height: 630,
        alt: "Selected Arko projects",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/social-card?v=4"],
  },
};

export default async function ProjectsPage() {
  const { projects, contact } = await getLandingContent();
  return (
    <div id="top" className="min-h-screen bg-ink pb-16 text-white md:pb-0">
      <section
        data-bg="light"
        className="relative overflow-hidden bg-acid px-4 pb-8 pt-24 text-ink md:px-10 md:pb-28 md:pt-44"
      >
        <div className="project-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto grid max-w-[90rem] items-center gap-5 md:gap-10 lg:grid-cols-[1fr_.8fr]">
          <div className="relative z-10">
            <Breadcrumbs
              className="mb-6 text-ink"
              items={[{ label: "Home", href: "/" }, { label: "Projects" }]}
            />
            <p className="eyebrow text-ink/60">{projects.eyebrow}</p>
            <h1 className="display mt-3 text-[3.3rem] leading-[0.84] md:mt-5 md:text-[clamp(4rem,10vw,9rem)]">
              {projects.heading}
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-ink/70 md:mt-10 md:text-2xl">
              {projects.intro}
            </p>
            <div className="mono mt-6 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 text-[0.5rem] font-bold uppercase tracking-wider md:mt-10 md:flex-wrap md:gap-2 md:text-[0.58rem]">
              <span className="border-2 border-ink bg-ink px-3 py-2 text-acid">
                {projects.items.length} live builds
              </span>
              <span className="border-2 border-ink px-3 py-2">
                Click to explore
              </span>
              <span className="border-2 border-ink px-3 py-2">
                Real websites
              </span>
            </div>
          </div>
          <div
            className="project-hero-model relative mx-auto aspect-[4/3] w-full max-w-[20rem] md:aspect-square md:max-w-[34rem]"
            aria-hidden
          >
            <div className="absolute inset-[11%] border-2 border-dashed border-ink/20" />
            <ProjectHelmet />
            <span className="mono absolute bottom-[12%] right-[4%] z-20 border-2 border-ink bg-ink px-3 py-2 text-[0.55rem] font-bold text-acid">
              LIVE / 09
            </span>
          </div>
        </div>
      </section>

      <section className="py-4 md:px-10 md:py-16">
        <ProjectGallery projects={projects.items} />
      </section>

      <section
        id="contact"
        className="relative overflow-hidden border-t-4 border-acid bg-ink px-4 py-20 text-white md:px-10 md:py-28"
      >
        <div
          aria-hidden
          className="display pointer-events-none absolute -bottom-8 left-0 select-none text-[25vw] leading-none text-white/[0.025]"
        >
          START
        </div>
        <div className="relative mx-auto grid max-w-[90rem] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-acid">{projects.ctaEyebrow}</p>
            <h2 className="display mt-4 text-[clamp(3rem,8vw,6.5rem)] text-acid">
              {projects.ctaHeading}
            </h2>
            <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-white/65 md:text-lg">
              {contact.paragraph}
            </p>
            <a
              href={`mailto:${contact.email}`}
              className="eyebrow mt-8 inline-flex min-h-11 items-center text-white/45 underline underline-offset-4 transition-colors hover:text-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
            >
              {contact.email}
            </a>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
