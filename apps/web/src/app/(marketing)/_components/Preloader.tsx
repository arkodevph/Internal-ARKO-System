"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export default function Preloader() {
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "exiting">(
    "loading",
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const dismiss = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    setDismissed(true);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    let readyTimer: ReturnType<typeof setTimeout>;
    const startedAt = performance.now();

    // iOS: must play/pause before seeking works
    const activate = () => {
      video.play();
      video.pause();
    };
    document.addEventListener("touchstart", activate, { once: true });

    video.src = "/services.mp4";
    video.load();
    const poll = () => {
      if (
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        video.readyState >= 2
      ) {
        video.currentTime = 0;
        const remaining = Math.max(0, 180 - (performance.now() - startedAt));
        readyTimer = setTimeout(() => {
          if (!cancelled)
            setPhase((current) => (current === "loading" ? "ready" : current));
        }, remaining);
        return;
      }
      pollTimer = setTimeout(poll, 150);
    };
    poll();

    // Safety: never trap the visitor behind media readiness.
    const safetyTimer = setTimeout(
      () => setPhase((current) => (current === "loading" ? "ready" : current)),
      300,
    );

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(readyTimer);
      clearTimeout(safetyTimer);
      document.removeEventListener("touchstart", activate);
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const exitTimer = setTimeout(
      () => setPhase("exiting"),
      reduceMotion ? 10 : 30,
    );
    return () => clearTimeout(exitTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "exiting") return;

    // animationend is not guaranteed when animations are cancelled during
    // hydration, tab suspension, or reduced-motion overrides.
    const dismissTimer = setTimeout(dismiss, 520);
    return () => clearTimeout(dismissTimer);
  }, [dismiss, phase]);

  if (dismissed) return null;

  return (
    <div
      data-entry-cover
      className={`arko-entry-${phase} fixed inset-0 z-[100] overflow-hidden text-ink ${
        phase === "exiting" ? "arko-entry-exit" : ""
      }`}
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && phase === "exiting")
          dismiss();
      }}
    >
      {/* hidden video - preload + iOS unlock */}
      <video ref={videoRef} muted playsInline preload="auto" className="hidden">
        <track
          kind="captions"
          src="/decorative-captions.vtt"
          srcLang="en"
          label="English"
          default
        />
      </video>

      <div className="arko-entry-panels absolute inset-0 grid grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="border-r border-ink/15 bg-acid" />
        ))}
      </div>

      <div
        className="arko-entry-grid pointer-events-none absolute inset-0 z-10 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,10,10,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,.18) 1px, transparent 1px)",
          backgroundSize: "clamp(3rem, 7vw, 7rem) clamp(3rem, 7vw, 7rem)",
        }}
      />

      <div className="arko-entry-stage pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div className="arko-entry-word" aria-hidden="true">
          {"ARKO".split("").map((letter, index) => (
            <span
              key={letter}
              style={{ "--letter-index": index } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="arko-entry-cube-shell" aria-hidden="true">
          <div className="arko-entry-cube">
            <div className="arko-entry-cube-face arko-entry-cube-front">
              <span className="arko-entry-cube-logo" />
              <small>ARKO / 01</small>
            </div>
            <div className="arko-entry-cube-face arko-entry-cube-back">
              <span>AI</span>
              <small>INTELLIGENCE / 02</small>
            </div>
            <div className="arko-entry-cube-face arko-entry-cube-left">
              <span>WEB</span>
              <small>INTERFACES / 03</small>
            </div>
            <div className="arko-entry-cube-face arko-entry-cube-right">
              <span>APP</span>
              <small>MOBILE / 04</small>
            </div>
            <div className="arko-entry-cube-face arko-entry-cube-top">
              <span>SYS</span>
              <small>AUTOMATION / 05</small>
            </div>
            <div className="arko-entry-cube-face arko-entry-cube-bottom">
              <span>BUILD</span>
              <small>SHIP / 06</small>
            </div>
          </div>
          <span className="arko-entry-cube-signal">LIVE SYSTEM</span>
        </div>

        <div className="arko-entry-coordinate left-5 top-24 md:left-10">
          X 14.5992 / Y 120.9842
        </div>
        <div className="arko-entry-coordinate bottom-24 right-5 text-right md:right-10">
          FULL-STACK SYSTEMS
          <br />
          DESIGN / ENGINEERING / AI
        </div>
      </div>

      <div className="arko-entry-top pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b border-ink/25 px-4 py-4 sm:px-6 sm:py-5 md:px-10">
        <span className="display text-2xl text-ink md:text-3xl">ARKO</span>
        <span className="eyebrow max-w-[11rem] text-right text-[.55rem] text-ink/55 sm:max-w-none sm:text-xs">
          Software studio / Brand system
        </span>
      </div>

      <div className="arko-entry-bottom pointer-events-none absolute inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-ink/25 md:grid-cols-4">
        {["Design", "Web", "Mobile", "Systems"].map((label, index) => (
          <div
            key={label}
            className="eyebrow border-r border-t border-ink/15 px-4 py-3 text-[.55rem] text-ink/50 sm:px-6 sm:text-xs md:border-t-0 md:px-10 md:py-4"
          >
            <span className="mr-2 text-ink">0{index + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="arko-entry-rule pointer-events-none absolute inset-x-4 bottom-[6.2rem] z-30 h-[3px] bg-ink/20 sm:inset-x-6 md:inset-x-10 md:bottom-[3.05rem]">
        <div className="arko-entry-rule-fill h-full origin-left bg-ink">
          <div className="absolute right-0 top-1/2 size-2.5 -translate-y-1/2 translate-x-1/2 bg-ink" />
        </div>
      </div>

      <div className="arko-entry-status eyebrow pointer-events-none absolute bottom-[7.3rem] left-4 z-30 text-[.55rem] text-ink sm:left-6 sm:text-xs md:bottom-[4.8rem] md:left-10">
        {phase === "loading" ? "Rendering ARKO" : "Ready"}
      </div>
    </div>
  );
}
