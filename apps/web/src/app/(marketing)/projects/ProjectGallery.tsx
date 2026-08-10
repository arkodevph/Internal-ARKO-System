"use client";

import Image from "next/image";
import { ArrowLeft, ArrowUpRight, ExternalLink, LockKeyhole, RotateCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LandingContent } from "../../../lib/landing/content";

type Project = LandingContent["projects"]["items"][number];

function displayDomain(domain: string) {
  if (!domain.endsWith(".vercel.app")) return domain;
  return `${domain.replace(/\.vercel\.app$/, "").replace(/^arko-/, "")}.com`;
}

function ProjectBrowser({ project, onClose }: { project: Project; onClose: () => void }) {
  const embeddingBlocked = project.domain === "co-map.vercel.app";
  const vanityUrl = `https://${displayDomain(project.domain)}`;
  const [loading, setLoading] = useState(!embeddingBlocked);
  const [frameReady, setFrameReady] = useState(embeddingBlocked);
  const [frameKey, setFrameKey] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setFrameReady(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const reload = () => {
    setLoading(true);
    setFrameReady(false);
    setFrameKey((key) => key + 1);
    requestAnimationFrame(() => requestAnimationFrame(() => setFrameReady(true)));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black p-2 sm:p-5 lg:p-8" role="dialog" aria-modal="true" aria-labelledby="project-browser-title">
      <div className="project-browser mx-auto flex h-full max-w-[96rem] flex-col overflow-hidden border-2 border-acid bg-ink">
        <div className="flex min-h-16 items-center gap-3 border-b-2 border-ink bg-acid px-3 text-ink sm:px-5">
          <div className="hidden items-center gap-2 sm:flex" aria-hidden>
            <span className="h-3 w-3 rounded-full border-2 border-ink" />
            <span className="h-3 w-3 rounded-full border-2 border-ink" />
            <span className="h-3 w-3 rounded-full bg-ink" />
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center border border-ink/20 transition-colors hover:bg-ink hover:text-acid" aria-label="Back to projects">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={reload} className="grid h-11 w-11 place-items-center border border-ink/20 transition-colors hover:bg-ink hover:text-acid" aria-label="Reload website">
            <RotateCw className="h-4 w-4" />
          </button>
          <div className="mono flex min-w-0 flex-1 items-center gap-2 border-2 border-ink bg-paper px-3 py-2.5 text-[0.62rem] font-semibold">
            <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{vanityUrl}</span>
          </div>
          <a href={project.href} target="_blank" rel="noopener noreferrer" className="mono hidden min-h-11 items-center gap-2 border-2 border-ink px-4 text-[0.62rem] font-bold uppercase tracking-wider transition-colors hover:bg-ink hover:text-acid sm:flex">
            Open externally <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button ref={closeRef} type="button" onClick={onClose} className="grid h-11 w-11 place-items-center border-2 border-ink transition-colors hover:bg-ink hover:text-acid" aria-label="Close project browser">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-white">
          {loading && (
            <div className="project-live-loader absolute inset-0 z-10 grid place-items-center overflow-hidden bg-ink text-acid">
              <div className="project-loader-grid absolute inset-0 opacity-20" />
              <div className="relative w-full max-w-sm px-8 text-center">
                <div className="project-loader-object relative mx-auto h-32 w-32 border-2 border-acid bg-acid">
                  <Image src="/projects/models/project-browser-halftone.png" alt="" fill sizes="128px" className="object-contain p-2" />
                </div>
                <p className="mono mt-8 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/35">Preparing live environment</p>
                <p className="display mt-2 truncate text-2xl text-acid">{project.title}</p>
                <div className="mt-6 h-1 overflow-hidden bg-white/10"><span className="project-loader-progress block h-full origin-left bg-acid" /></div>
                <div className="mono mt-3 flex justify-between text-[0.5rem] uppercase tracking-wider text-white/25"><span>Connecting</span><span>{displayDomain(project.domain)}</span></div>
              </div>
            </div>
          )}
          {embeddingBlocked ? (
            <div className="relative grid h-full place-items-center overflow-hidden bg-ink p-6 text-center">
              <Image src={project.image} alt="" fill sizes="100vw" className="object-cover opacity-20 blur-sm" />
              <div className="relative max-w-md border-2 border-acid bg-ink p-8 text-white shadow-[10px_10px_0_#b8ff2e]">
                <LockKeyhole className="mx-auto h-7 w-7 text-acid" />
                <h3 className="display mt-5 text-3xl">Protected live site</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/55">This project prevents all third-party embedding. Open it directly for the full experience.</p>
                <a href={project.href} target="_blank" rel="noopener noreferrer" className="mono mt-6 inline-flex min-h-11 items-center gap-2 border-2 border-acid bg-acid px-4 text-[0.62rem] font-bold uppercase tracking-wider text-ink">Open live project <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          ) : frameReady ? (
            <iframe key={frameKey} src={project.href} title={`${project.title} live website`} className="h-full w-full border-0 bg-white" onLoad={() => setLoading(false)} allow="fullscreen" />
          ) : null}
          <a href={project.href} target="_blank" rel="noopener noreferrer" className="mono absolute bottom-3 right-3 z-20 flex min-h-11 items-center gap-2 border-2 border-ink bg-acid px-4 text-[0.6rem] font-bold uppercase tracking-wider text-ink shadow-[4px_4px_0_#0a0a0a] sm:hidden">
            Open site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mono flex min-h-8 items-center justify-between gap-4 border-t border-white/10 bg-ink px-4 text-[0.52rem] uppercase tracking-wider text-white/35">
          <span id="project-browser-title">Live preview / {project.title}</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default function ProjectGallery({ projects }: { projects: Project[] }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(projects.map((project) => project.category)))], [projects]);
  const visibleProjects = activeCategory === "All" ? projects : projects.filter((project) => project.category === activeCategory);

  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="mb-8 flex flex-col gap-4 border-y border-white/15 py-4 md:flex-row md:items-center md:justify-between">
        <div><p className="eyebrow text-white/45">Select a project</p><p className="mono mt-1 text-[0.62rem] text-white/30">Click any cover to enter the live site.</p></div>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Project categories">
          {categories.map((category) => (
            <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)} className={`mono min-h-10 shrink-0 border px-3 py-2 text-[0.58rem] font-bold uppercase tracking-wider transition-colors ${activeCategory === category ? "border-acid bg-acid text-ink" : "border-white/20 text-white/50 hover:border-acid hover:text-acid"}`}>{category}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => (
          <button key={project.href} type="button" onClick={() => setActiveProject(project)} className="project-portal group relative cursor-pointer overflow-hidden border-2 border-white/15 bg-ink-soft text-left transition-colors hover:border-acid focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-acid" aria-label={`Load ${project.title} in the project browser`}>
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              <Image src={project.image} alt={`${project.title} website preview`} fill sizes="(min-width:1280px) 31vw,(min-width:640px) 48vw,100vw" className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
              <span className="display absolute left-4 top-4 border-2 border-ink bg-acid px-2.5 py-1.5 text-xs text-ink">{project.number}</span>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="eyebrow text-acid">{project.category}</p>
                <h2 className="display mt-2 text-3xl leading-none text-white md:text-4xl">{project.title}</h2>
                <p className="mt-2 text-sm font-semibold text-white/60">{project.type}</p>
              </div>
              <span className="absolute right-4 top-4 grid h-12 w-12 translate-y-2 place-items-center border-2 border-acid bg-ink text-acid opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:bg-acid group-hover:text-ink group-hover:opacity-100"><ArrowUpRight className="h-5 w-5" /></span>
            </div>
            <div className="mono flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[0.58rem] uppercase tracking-wider text-white/35"><span className="truncate">{displayDomain(project.domain)}</span><span className="shrink-0 text-acid">Launch ↗</span></div>
          </button>
        ))}
      </div>

      <p className="mono mt-6 text-right text-[0.58rem] uppercase tracking-wider text-white/25">{visibleProjects.length} projects / live archive</p>
      {activeProject && <ProjectBrowser project={activeProject} onClose={() => setActiveProject(null)} />}
    </div>
  );
}
