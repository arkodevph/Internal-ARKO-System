"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, type PointerEvent } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import type { LandingContent } from "@/lib/landing/content";
import styles from "./ink.module.css";

const HERO_POSTER = "/themes/ink/mechanical-hero.webp";
const CITY_ART = "/themes/ink/urban-halftone.webp";

function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="24" />
      <circle cx="40" cy="40" r="13" />
      <path d="M40 0v80M0 40h80" />
      <circle cx="40" cy="40" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InkHero({ paragraph }: { paragraph: string }) {
  const maskId = useId();
  const reducedMotion = useReducedMotion();

  function moveArtwork(event: PointerEvent<HTMLElement>) {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--hero-x",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}px`,
    );
    event.currentTarget.style.setProperty(
      "--hero-y",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * 12}px`,
    );
  }

  return (
    <section
      id="top"
      className={styles.hero}
      onPointerMove={moveArtwork}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--hero-x", "0px");
        event.currentTarget.style.setProperty("--hero-y", "0px");
      }}
    >
      <div className={styles.heroIndex}>
        <span>Design & code / Independent by nature</span>
        <span>Est. 2025 · PH</span>
      </div>
      <h1 className={styles.heroTitle}>
        <span className={styles.srOnly}>
          ARKODEVPH — Independent software studio
        </span>
        <svg
          viewBox="0 0 1400 480"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={styles.heroLetters}
        >
          <defs>
            <mask
              id={maskId}
              x="0"
              y="0"
              width="1400"
              height="480"
              maskUnits="userSpaceOnUse"
            >
              <text
                x="0"
                y="460"
                textLength="1400"
                lengthAdjust="spacingAndGlyphs"
                fill="white"
                className={styles.maskText}
              >
                ARKODEVPH
              </text>
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <rect width="1400" height="480" fill="var(--paper)" />
            <image
              href={HERO_POSTER}
              x="-20"
              y="-40"
              width="1440"
              height="650"
              preserveAspectRatio="xMidYMid slice"
              className={styles.heroArtwork}
            />
          </g>
        </svg>
      </h1>
      <div className={styles.heroBottom}>
        <div>
          <p className={styles.label}>
            A small studio with a hands-on approach.
          </p>
          <p className={styles.heroStatement}>
            INDEPENDENT MINDS.
            <br />
            USEFUL SOFTWARE.
          </p>
        </div>
        <div className={styles.heroDescription}>
          <p>{paragraph}</p>
          <a className={styles.textLink} href="#work">
            Explore our work <span aria-hidden="true">↗</span>
          </a>
        </div>
        <a
          href="#story"
          className={styles.scrollCue}
          aria-label="Scroll to our approach"
        >
          <Crosshair />
          <span>Scroll to explore ↓</span>
        </a>
      </div>
      <div className={styles.heroFooter}>
        <span>Web / Mobile / Automation / AI</span>
        <span>Built with intent. From the Philippines.</span>
      </div>
    </section>
  );
}

function ScrollPoster() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.85], [1, 2.15]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const rayScale = useTransform(scrollYProgress, [0, 1], [1, 1.45]);
  const rays = Array.from({ length: 28 }, (_, index) => {
    const angle = (index / 28) * Math.PI * 2;
    const inner = 45 + (index % 4) * 18;
    return {
      x1: 700 + Math.cos(angle) * inner,
      y1: 420 + Math.sin(angle) * inner,
      x2: 700 + Math.cos(angle) * 1000,
      y2: 420 + Math.sin(angle) * 1000,
    };
  });

  return (
    <section
      id="story"
      ref={ref}
      className={styles.story}
      aria-labelledby="story-heading"
    >
      <div className={styles.storyStage}>
        <div className={styles.sectionIndex}>
          <span>01 / From idea to something real</span>
          <span>Arko — Field notes</span>
        </div>
        <motion.div
          className={styles.storyHeading}
          style={
            reducedMotion ? undefined : { y: titleY, opacity: titleOpacity }
          }
        >
          <h2 id="story-heading">MAKE IT</h2>
          <span className={styles.storyAnnotation}>mean something.</span>
        </motion.div>
        <motion.svg
          className={styles.rays}
          viewBox="0 0 1400 900"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={reducedMotion ? undefined : { scale: rayScale }}
        >
          {rays.map((ray, index) => (
            <line key={index} {...ray} strokeWidth={index % 4 === 0 ? 2 : 1} />
          ))}
          <circle cx="700" cy="420" r="8" fill="currentColor" />
        </motion.svg>
        <div className={styles.storyCenter}>
          <motion.figure
            className={styles.storyImage}
            style={reducedMotion ? undefined : { scale }}
          >
            <Image
              src={CITY_ART}
              alt="An archway connecting a Philippine city street, rendered in black and white halftone"
              fill
              sizes="(max-width: 700px) 90vw, 65vw"
            />
            <span className={styles.imageRegister} aria-hidden="true">
              ARKO / 001
            </span>
          </motion.figure>
        </div>
        <div className={styles.storyCredits}>
          <p>
            <span>THE STARTING POINT</span>A good question.
            <br />
            An idea worth building.
          </p>
          <p>
            <span>THE WAY WE WORK</span>Think it through.
            <br />
            Make it work.
          </p>
        </div>
        <div className={styles.storyBottom}>
          <p>
            GOOD IDEAS DESERVE
            <br />
            TO SEE THE REAL WORLD.
          </p>
          <div className={styles.storySteps}>
            <span>01 / Imagine</span>
            <span>02 / Build</span>
            <span>03 / Ship</span>
          </div>
          <div className={styles.storyProgress} aria-hidden="true">
            <motion.div
              style={{ scaleX: reducedMotion ? 1 : scrollYProgress }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Studio({ content }: { content: LandingContent }) {
  return (
    <section
      id="studio"
      className={styles.studio}
      aria-labelledby="studio-heading"
    >
      <div className={styles.studioVisual}>
        <Image
          src={CITY_ART}
          alt="A graphic halftone study of concrete arches, balconies, and urban connections"
          fill
          sizes="100vw"
        />
        <div className={styles.studioStamp}>
          <span className={styles.stampMark}>a↗</span>
          <span>
            ARKO
            <br />
            SOFTWARE
            <br />
            STUDIO.
          </span>
        </div>
        <span className={styles.verticalLabel}>
          Independent minds. Shared purpose.
        </span>
      </div>
      <div className={styles.studioBody}>
        <h2 id="studio-heading" className={styles.studioTitle}>
          arko.
        </h2>
        <div className={styles.studioGrid}>
          <div className={styles.studioIntro}>
            <p className={styles.label}>02 / The studio</p>
            <h3>
              Small team.
              <br />
              Whole picture.
            </h3>
            <p>{content.footer.brandBlurb}</p>
            <a className={styles.textLink} href="#contact">
              Meet your next team <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={styles.disciplines}>
            {content.work.cards.map((card, index) => (
              <article key={card.kind}>
                <p className={styles.label}>
                  0{index + 1} / {card.kind}
                </p>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
          <p className={styles.studioManifesto}>
            Less
            <br />
            noise.
            <br />
            More
            <br />
            <span>purpose.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function SelectedWork({ content }: { content: LandingContent }) {
  return (
    <section id="work" className={styles.work} aria-labelledby="work-heading">
      <div className={styles.sectionIndex}>
        <span>03 / A few things we’ve built</span>
        <Link href="/projects">All projects ↗</Link>
      </div>
      <div className={styles.workHeading}>
        <h2 id="work-heading">
          SELECTED
          <br />
          <span>WORK.</span>
        </h2>
        <p>
          Different ideas.
          <br />
          The same attention to detail.
        </p>
      </div>
      <div className={styles.workGrid}>
        {content.projects.items.slice(0, 4).map((project) => (
          <a
            key={project.href}
            href={project.href}
            className={styles.project}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.projectImage}>
              {project.image ? (
                <Image
                  src={project.image}
                  alt={`${project.title} website preview`}
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              ) : (
                <span className={styles.projectFallback}>{project.title}</span>
              )}
              <span className={styles.projectOpen} aria-hidden="true">
                ↗
              </span>
            </div>
            <div className={styles.projectCaption}>
              <span className={styles.label}>{project.number}</span>
              <h3>{project.title}</h3>
              <span>{project.category}</span>
            </div>
            <p className={styles.projectType}>
              {project.type}{" "}
              <span className={styles.srOnly}>(opens in a new tab)</span>
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function InkLanding({ content }: { content: LandingContent }) {
  return (
    <>
      <InkHero paragraph={content.hero.paragraph} />
      {content.sections.process && <ScrollPoster />}
      {content.sections.services && <Studio content={content} />}
      {content.sections.work && <SelectedWork content={content} />}
      <footer id="contact" className={styles.contact}>
        <div className={styles.sectionIndex}>
          <span>04 / Next is yours</span>
          <span>Philippines ↗ Everywhere</span>
        </div>
        <p className={styles.label}>Have something in mind?</p>
        <a
          href={`mailto:${content.contact.email}`}
          className={styles.contactTitle}
        >
          LET’S MAKE
          <br />
          IT <span>REAL.</span>
          <span className={styles.contactArrow} aria-hidden="true">
            ↗
          </span>
        </a>
        <div className={styles.contactDetails}>
          <a href={`mailto:${content.contact.email}`}>
            {content.contact.email}
          </a>
          <p>
            Tell us what you’re thinking.
            <br />
            We’ll work out the next step together.
          </p>
        </div>
        <div className={styles.footerBottom}>
          <a href="#top" className={styles.wordmark}>
            arkō®
          </a>
          <span>© {new Date().getFullYear()} Arko Software Studio</span>
          <div>
            <a
              href={content.footer.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
            <Link href="/privacy">Privacy</Link>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}
