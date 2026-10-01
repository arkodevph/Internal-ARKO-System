import Link from "next/link";
import HeroCharacter from "./_components/HeroCharacter";
import CountUp from "./_components/CountUp";
import RotatingText from "./_components/RotatingText";
import ServicesSection from "./_components/ServicesSection";
import ScrollProcess from "./_components/ScrollProcess";
import ScrollWork from "./_components/ScrollWork";
import ContactForm from "./_components/ContactForm";
import HeroFunnel from "./_components/HeroFunnel";
import ScrollReveal from "./_components/ScrollReveal";
import Squares from "./_components/Squares";
import LandingViewTracker from "./_components/LandingViewTracker";
import FaqSection from "./_components/FaqSection";
import TeamSection from "./_components/TeamSection";
import { getLandingContent } from "../../lib/landing/get-content";
import type { LandingContent } from "../../lib/landing/content";

function Hero({ hero }: { hero: LandingContent["hero"] }) {
  return (
    <section
      id="top"
      data-bg="light"
      className="group/hero relative z-10 bg-acid text-ink"
    >
      <div className="relative z-10">
        <div className="px-6 pb-16 pt-32 md:px-10 md:pb-24 md:pt-44 lg:pr-[44vw]">
          <p className="eyebrow mb-6 text-ink/70">{hero.eyebrow}</p>
          <h1 className="display text-[clamp(2.75rem,11vw,9rem)]">
            {hero.headingLead}
            <br />
            <span className="mt-2 inline-flex bg-ink px-3 py-1 text-acid">
              <RotatingText
                texts={hero.roles}
                className="text-[clamp(2.1rem,8.5vw,7rem)]"
              />
            </span>
          </h1>
          <div className="mt-10 flex flex-col gap-6">
            <p className="max-w-md text-base font-medium text-ink/80 md:text-lg">
              {hero.paragraph}
            </p>
            <HeroFunnel />
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="display absolute -bottom-10 right-0 select-none text-[22vw] leading-none text-ink/10">
          ARKO
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-14 -right-[2%] w-[112vw] [perspective:1000px] md:-bottom-40 md:right-[8%] md:w-[min(78vw,1240px)]">
        <HeroCharacter />
      </div>
    </section>
  );
}

function Stats({ stats }: { stats: LandingContent["stats"] }) {
  const visibleStats = stats.filter((stat) => stat.displayText !== "");
  const notes = [
    "Strategy, design, engineering, and automation.",
    "Web and mobile shaped as one product system.",
    "Direct access to the people building your product.",
  ];

  return (
    <section className="border-b-4 border-ink bg-ink text-white">
      <div className="grid border-b border-acid/20 md:grid-cols-[1.15fr_1fr]">
        <div className="border-acid/20 px-6 py-14 md:border-r md:px-10 md:py-20">
          <p className="eyebrow mb-6 text-acid/60">Small studio by design</p>
          <h2 className="display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.82]">
            One team.
            <br />
            <span className="text-acid">Zero handoffs.</span>
          </h2>
        </div>
        <div className="flex items-end px-6 py-10 md:px-10 md:py-20">
          <p className="max-w-xl text-lg font-medium leading-relaxed text-white/65 md:text-2xl">
            From the first sketch to launch day, you work with the same people
            making the decisions and writing the code.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3">
        {visibleStats.map((stat, index) => (
          <ScrollReveal key={stat.label} delay={index * 0.08} className="h-full">
            <article
              className={`group relative h-full min-h-64 overflow-hidden border-acid/20 px-6 py-8 md:min-h-80 md:px-10 md:py-10 ${index > 0 ? "border-t md:border-l md:border-t-0" : ""}`}
            >
              <span className="eyebrow text-white/35">0{index + 1}</span>
              <CountUp
                to={stat.to}
                suffix={stat.suffix}
                className="display mt-8 block text-[clamp(5rem,10vw,9rem)] leading-none text-acid"
              />
              <h3 className="display mt-5 max-w-xs text-2xl uppercase text-white md:text-3xl">
                {stat.label}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45 md:text-base">
                {notes[index]}
              </p>
              <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-acid transition-transform duration-500 group-hover:scale-x-100" />
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function Intro({ intro }: { intro: LandingContent["intro"] }) {
  return (
    <section
      className="bg-acid px-6 py-20 text-ink md:px-10 md:py-28"
      data-bg="light"
    >
      <ScrollReveal>
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <h2 className="display text-[clamp(3rem,9vw,7rem)]">
            {intro.heading}
            <span className="text-ink/40">*</span>
          </h2>
          <div className="max-w-xl">
            <p className="eyebrow mb-6 text-ink/60">{intro.eyebrowNote}</p>
            <p className="text-lg font-medium leading-relaxed md:text-2xl">
              {intro.bodyBefore}
              <span className="bg-ink px-2 text-acid">
                {intro.bodyHighlight}
              </span>
              {intro.bodyAfter}
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function Contact({ contact }: { contact: LandingContent["contact"] }) {
  return (
    <section id="contact" className="bg-ink px-6 py-24 md:px-10">
      <ScrollReveal>
        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-20">
          <div className="relative">
            {/* Whole dotted world map, contained behind the heading text */}
            <img
              src="/world-dots.svg"
              alt=""
              aria-hidden
              width={1190}
              height={600}
              className="pointer-events-none absolute left-1/2 top-1/2 w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-20"
            />
            <div className="relative z-10">
              <h2 className="display text-[clamp(2.5rem,9vw,6.5rem)] text-acid">
                {contact.headingLine1}
                <br />
                {contact.headingLine2}
              </h2>
              <p className="mt-6 max-w-sm text-base font-medium text-white/70">
                {contact.paragraph}
              </p>
              <p className="eyebrow mt-10 text-white/40">{contact.email}</p>
            </div>
          </div>
          <ContactForm />
        </div>
      </ScrollReveal>
    </section>
  );
}

function Footer({ footer }: { footer: LandingContent["footer"] }) {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* - ghost watermark - */}
      <div
        aria-hidden
        className="display pointer-events-none absolute -bottom-4 right-0 select-none text-[clamp(12rem,30vw,36rem)] leading-none text-white/[0.02]"
      >
        ARKO
      </div>

      {/* - Squares texture - */}
      <div className="absolute inset-0 opacity-[0.08]">
        <Squares
          direction="diagonal"
          speed={0.15}
          squareSize={36}
          borderColor="rgba(184,255,46,0.12)"
          hoverFillColor="rgba(184,255,46,0.06)"
        />
      </div>

      {/* - code-native contact-to-footer seam - */}
      <div
        aria-hidden
        data-contact-footer-seam
        className="relative z-10 grid grid-cols-2 overflow-hidden border-y-4 border-acid md:grid-cols-[1fr_7rem_1fr]"
      >
        <div className="relative overflow-hidden bg-ink px-6 py-8 md:px-10 md:py-10">
          <div className="absolute inset-0 opacity-30">
            <Squares direction="right" speed={0.12} squareSize={34} />
          </div>
          <span className="display relative text-[clamp(3.5rem,9vw,8rem)] text-acid">
            Build
          </span>
        </div>
        <div className="display hidden items-center justify-center border-x-4 border-ink bg-acid text-5xl text-ink md:flex">
          →
        </div>
        <div className="relative overflow-hidden bg-acid px-6 py-8 text-right md:px-10 md:py-10">
          <div className="absolute inset-0 opacity-20">
            <Squares
              direction="left"
              speed={0.12}
              squareSize={34}
              borderColor="rgba(10,10,10,0.35)"
              hoverFillColor="rgba(10,10,10,0.12)"
            />
          </div>
          <span className="display relative text-[clamp(3.5rem,9vw,8rem)] text-ink">
            Ship
          </span>
        </div>
      </div>

      {/* - thick acid-green top border with badge - */}
      <div className="relative z-10 border-t-8 border-acid">
        <span className="mono absolute left-6 top-0 -translate-y-1/2 bg-acid px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink">
          Est. 2025
        </span>
      </div>

      {/* - main grid - */}
      <div className="relative z-10 grid border-t border-white/10 md:grid-cols-[1.5fr_1.5fr_2fr]">
        {/* col 1 - brand */}
        <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-10">
          <div className="display text-4xl tracking-tighter text-acid">
            ARKO
          </div>
          <p className="mono mt-3 max-w-xs text-sm leading-relaxed text-white/45">
            {footer.brandBlurb}
          </p>
          <div className="mono mt-8 space-y-2 text-sm">
            <a
              href={`mailto:${footer.email}`}
              className="inline-flex items-center gap-2 text-white/60 underline underline-offset-4 transition-colors hover:text-acid"
            >
              <span className="text-acid">→</span> {footer.email}
            </a>
          </div>
          <div className="mono mt-6 flex gap-5 text-xs text-white/30">
            <a
              href={footer.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-acid"
            >
              GitHub ↗
            </a>
            <span className="text-white/15">/</span>
            <a
              href={`mailto:${footer.email}`}
              className="transition-colors hover:text-acid"
            >
              Email
            </a>
          </div>
        </div>

        {/* col 2 - what we do */}
        <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-10">
          <p className="eyebrow text-acid">What we do</p>
          <ul className="mono mt-6 space-y-3 text-sm">
            {footer.whatWeDo.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="group inline-flex items-center gap-2 text-white/50 underline underline-offset-4 transition-colors hover:text-acid"
                >
                  <span className="text-acid/0 transition-colors group-hover:text-acid">
                    ▸
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* col 3 - CTA (featured) */}
        <div className="relative flex flex-col items-start p-8 md:p-10">
          <p className="eyebrow text-acid/60">Start building</p>
          <p className="display mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-[0.85] text-white">
            {footer.ctaLine1}
            <br />
            {footer.ctaLine2}
            <br />
            <span className="text-acid">{footer.ctaLine3}</span>
          </p>
          <a
            href="#contact"
            className="mono group mt-6 inline-flex items-center gap-3 border-2 border-acid px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-acid transition-all hover:bg-acid hover:text-ink"
          >
            Start a project
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
          <p className="mono mt-6 text-xs text-white/30">
            Or email{" "}
            <a
              href={`mailto:${footer.email}`}
              className="text-white/60 underline underline-offset-4 transition-colors hover:text-acid"
            >
              {footer.email}
            </a>
          </p>
        </div>
      </div>

      {/* - bottom stripe - */}
      <div className="relative z-10 flex flex-col items-start justify-between gap-3 px-8 py-5 md:flex-row md:items-center md:px-10">
        <p className="mono text-[0.65rem] text-white/25">
          © {new Date().getFullYear()} Arko Studio
        </p>
        <div className="mono flex items-center gap-4 text-[0.65rem] text-white/25">
          <Link
            href="/privacy"
            className="underline underline-offset-4 transition-colors hover:text-acid"
          >
            Privacy
          </Link>
          <Link
            href="/#faq"
            className="underline underline-offset-4 transition-colors hover:text-acid"
          >
            FAQ
          </Link>
          <Link
            href="/projects"
            className="underline underline-offset-4 transition-colors hover:text-acid"
          >
            Projects
          </Link>
        </div>
        <p className="mono text-[0.65rem] text-white/25">{footer.location}</p>
      </div>
    </footer>
  );
}

export default async function Home() {
  const content = await getLandingContent();
  return (
    <>
      <LandingViewTracker />
      <Hero hero={content.hero} />
      {content.sections.stats && <Stats stats={content.stats} />}
      {content.sections.intro && <Intro intro={content.intro} />}
      {content.sections.services && <ServicesSection {...content.services} />}
      {content.sections.work && (
        <ScrollWork {...content.work} projects={content.projects.items} />
      )}
      {content.sections.process && <ScrollProcess {...content.process} />}
      <TeamSection />
      <FaqSection />
      {content.sections.contact && <Contact contact={content.contact} />}
      <Footer footer={content.footer} />
    </>
  );
}
