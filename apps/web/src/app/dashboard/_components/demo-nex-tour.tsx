"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NexMascot } from "../../../components/nex-mascot";

const steps = [
  {
    target: "overview",
    eyebrow: "Your command center",
    title: "Welcome to ARKO",
    body: "I’m NEX, your workspace guide. This is a safe, read-only preview built with fictional data.",
  },
  {
    target: "metrics",
    eyebrow: "Signals that matter",
    title: "Read the business in seconds",
    body: "Revenue, active work, capacity, and audience growth stay visible without opening another report.",
  },
  {
    target: "insights",
    eyebrow: "From data to direction",
    title: "Spot momentum early",
    body: "Track financial movement beside delivery progress, so decisions happen with the full picture in view.",
  },
  {
    target: "nex",
    eyebrow: "Built-in intelligence",
    title: "NEX turns signals into next steps",
    body: "In a live workspace, NEX can surface risks, summarize activity, and recommend what deserves attention next.",
  },
];

type Highlight = { top: number; left: number; width: number; height: number };

export function DemoNexTour() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const reduceMotion = useReducedMotion();

  const updateHighlight = useCallback(() => {
    const element = document.querySelector<HTMLElement>(
      `[data-demo-tour="${steps[step].target}"]`,
    );
    if (!element) return setHighlight(null);
    const rect = element.getBoundingClientRect();
    setHighlight({
      top: Math.max(8, rect.top - 6),
      left: Math.max(8, rect.left - 6),
      width: Math.min(window.innerWidth - 16, rect.width + 12),
      height: Math.min(window.innerHeight - 16, rect.height + 12),
    });
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const element = document.querySelector<HTMLElement>(
      `[data-demo-tour="${steps[step].target}"]`,
    );
    element?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    const timer = window.setTimeout(updateHighlight, reduceMotion ? 0 : 420);
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [open, reduceMotion, step, updateHighlight]);

  const close = () => {
    setOpen(false);
    setHighlight(null);
  };

  const restart = () => {
    setStep(0);
    setOpen(true);
  };

  const current = steps[step];

  return (
    <>
      <AnimatePresence>
        {open && highlight ? (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: highlight.top,
              left: highlight.left,
              width: highlight.width,
              height: highlight.height,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="pointer-events-none fixed z-40 rounded-[1.75rem] border-2 border-primary-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.46),0_0_36px_rgba(34,197,94,0.34)]"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {open ? (
          <motion.aside
            key={step}
            role="dialog"
            aria-live="polite"
            aria-label="NEX demo walkthrough"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-[1.75rem] border border-primary-500/35 bg-bg-sidebar/95 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-5 sm:w-[23rem]"
          >
            <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-300 to-primary-500" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary-500/10 p-1">
                  <NexMascot iconStyle="BOT" accentColor="#22C55E" size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-primary-400">
                    {current.eyebrow}
                  </p>
                  <h2 className="mt-1 text-base font-semibold">
                    {current.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close demo tour"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle text-text-tertiary transition-colors hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {current.body}
              </p>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-1.5"
                  aria-label={`Step ${step + 1} of ${steps.length}`}
                >
                  {steps.map((item, index) => (
                    <span
                      key={item.target}
                      className={`h-1.5 rounded-full transition-all ${index === step ? "w-6 bg-primary-500" : "w-1.5 bg-border-subtle"}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex min-h-10 items-center gap-1.5 rounded-full border border-border-subtle px-3 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      step === steps.length - 1 ? close() : setStep(step + 1)
                    }
                    className="flex min-h-10 items-center gap-2 rounded-full bg-primary-500 px-4 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition-transform hover:scale-[1.02]"
                  >
                    {step === steps.length - 1 ? "Explore demo" : "Continue"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        ) : (
          <motion.button
            type="button"
            onClick={restart}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-primary-500/35 bg-bg-sidebar/95 px-4 text-xs font-bold shadow-xl backdrop-blur-xl sm:bottom-5 sm:right-5"
          >
            <NexMascot iconStyle="BOT" accentColor="#22C55E" size="sm" />
            Replay NEX tour
            <RotateCcw className="h-3.5 w-3.5 text-primary-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
