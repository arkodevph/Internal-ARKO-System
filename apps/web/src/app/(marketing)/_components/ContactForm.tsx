"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { type ContactState, sendContact } from "../actions/contact";
import StarBorder from "./StarBorder";
import { useMarketingPageTransition } from "./MarketingPageTransition";

const LS_KEY = "arko_submitted";
const initial: ContactState = { status: "idle" };

const FIELDS = [
  { name: "name", label: "Your name", type: "text" },
  { name: "email", label: "Work email", type: "email" },
] as const;

const PROJECT_TYPES = [
  "Website",
  "Mobile app",
  "Automation",
  "AI feature",
] as const;

function readPersisted(): ContactState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ContactState;
    if (p.status === "success" || p.status === "exhausted") return p;
    return null;
  } catch {
    return null;
  }
}

function persist(st: ContactState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(st));
  } catch {
    /* noop */
  }
}

export default function ContactForm() {
  const navigate = useMarketingPageTransition();
  const [doneState, setDoneState] = useState<ContactState | null>(null);
  const [message, setMessage] = useState("");
  const [state, formAction, pending] = useActionState(sendContact, initial);

  // Hydration-safe: restore from localStorage after mount
  useEffect(() => {
    setDoneState(readPersisted());
  }, []);

  useEffect(() => {
    const receiveIdea = (event: Event) => {
      const idea = (event as CustomEvent<string>).detail;
      if (idea) setMessage(idea);
    };
    window.addEventListener("arko:funnel", receiveIdea);
    return () => window.removeEventListener("arko:funnel", receiveIdea);
  }, []);

  // Persist done states so they survive future refreshes
  useEffect(() => {
    if (state.status === "success" || state.status === "exhausted") {
      persist(state);
      setDoneState(state);
    }
    // Send successful submissions to the dedicated thank-you page
    // (dedicated URL for analytics conversion tracking).
    if (state.status === "success") {
      navigate("/thank-you");
    }
  }, [state, navigate]);

  // - render -   // Use live state if done, otherwise fall back to persisted state
  const final: ContactState | null =
    state.status === "success" || state.status === "exhausted"
      ? state
      : doneState;

  const startAnotherBrief = () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // Reloading still clears the in-memory confirmation state.
    }
    window.location.reload();
  };

  if (final && final.status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative flex min-h-[26rem] w-full min-w-0 flex-col overflow-hidden border-2 border-acid/40 bg-white/[0.025] p-4 shadow-[6px_6px_0_rgba(184,255,46,.12)] sm:min-h-[32rem] sm:p-6 sm:shadow-[10px_10px_0_rgba(184,255,46,.12)] md:p-8"
      >
        <div
          aria-hidden
          className="project-grid pointer-events-none absolute inset-0 opacity-[0.06]"
        />
        <div className="relative flex items-center justify-between border-b border-white/10 pb-5">
          <p className="eyebrow text-acid">Project brief / received</p>
          <span className="mono text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
            Status 200
          </span>
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-10">
          <span className="mb-7 flex h-16 w-16 items-center justify-center border-2 border-acid bg-acid text-ink shadow-[6px_6px_0_rgba(184,255,46,.2)]">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </span>
          <p className="display max-w-xl text-[clamp(2.35rem,12vw,5.5rem)] leading-[0.82] text-acid">
            Message sent.
          </p>
          <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-white/70 md:text-lg">
            {final.message}
          </p>
        </div>

        <div className="relative flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="mono flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-wider text-white/45">
            <Clock3 className="h-4 w-4 text-acid" /> Reply expected within 24
            hours
          </span>
          <button
            type="button"
            onClick={startAnotherBrief}
            className="mono min-h-11 cursor-pointer border-2 border-acid px-4 text-[0.62rem] font-bold uppercase tracking-wider text-acid transition-colors hover:bg-acid hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
          >
            Send another brief
          </button>
        </div>
      </div>
    );
  }

  if (final && final.status === "exhausted") {
    return (
      <div className="flex min-h-[26rem] w-full min-w-0 flex-col justify-center border-2 border-white/15 bg-white/[0.025] p-4 shadow-[6px_6px_0_rgba(184,255,46,.12)] sm:min-h-[32rem] sm:p-6 sm:shadow-[10px_10px_0_rgba(184,255,46,.12)] md:p-8">
        <p className="eyebrow mb-8 text-white/40">Project brief / fallback</p>
        <p className="display text-[clamp(2.35rem,12vw,5.5rem)] leading-[0.82] text-acid">
          Inbox full.
        </p>
        <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-white/70 md:text-lg">
          Thanks for reaching out. Reach us directly at{" "}
          <a
            href="mailto:contact@arkodevph.com"
            className="text-acid underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
          >
            contact@arkodevph.com
          </a>
        </p>
      </div>
    );
  }

  // SSR / first paint: match the form so hydration doesn't mismatch
  return (
    <form
      id="contact-form"
      action={formAction}
      className="relative flex w-full min-w-0 flex-col gap-6 border-2 border-white/15 bg-white/[0.025] p-4 shadow-[6px_6px_0_rgba(184,255,46,.12)] sm:p-5 sm:shadow-[10px_10px_0_rgba(184,255,46,.12)] md:p-8"
    >
      <div className="border-b border-white/10 pb-5">
        <p className="eyebrow text-acid">Request a demo / 01</p>
        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/55">
          Add your name, work email, and a few details. We&apos;ll arrange the
          right demo for you.
        </p>
      </div>

      <fieldset>
        <legend className="eyebrow mb-3 text-white/50">
          What can we build for you?
        </legend>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {PROJECT_TYPES.map((type) => (
            <label key={type} className="group cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name="projectType"
                value={type}
                aria-label={type}
                required
              />
              <span className="mono flex min-h-12 items-center justify-between border border-white/15 px-3 text-[0.62rem] font-bold uppercase tracking-wider text-white/50 transition-all group-hover:border-acid/50 group-hover:text-white peer-checked:border-acid peer-checked:bg-acid peer-checked:text-ink">
                {type}
                <CheckCircle2 className="h-3.5 w-3.5 opacity-30" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="flex flex-col gap-2">
            <span className="eyebrow text-white/50">{f.label}</span>
            <input
              name={f.name}
              type={f.type}
              aria-label={f.label}
              required
              autoComplete={f.name}
              placeholder={
                f.name === "name"
                  ? "How should we address you?"
                  : "you@company.com"
              }
              className="min-h-12 border border-white/15 bg-ink px-4 text-base font-medium text-white outline-none transition-all placeholder:text-white/20 hover:border-white/30 focus:border-acid focus:ring-2 focus:ring-acid/15"
            />
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-2">
        <span className="flex items-center justify-between">
          <span className="eyebrow text-white/50">What are you building?</span>
          <span className="mono text-[0.52rem] text-white/25">
            {message.length}/1200
          </span>
        </span>
        <textarea
          name="message"
          aria-label="What are you building?"
          rows={3}
          required
          value={message}
          maxLength={1200}
          placeholder="The idea, who it is for, and what success looks like..."
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-32 resize-none border border-white/15 bg-ink p-4 text-base font-medium leading-relaxed text-white outline-none transition-all placeholder:text-white/20 hover:border-white/30 focus:border-acid focus:ring-2 focus:ring-acid/15"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="eyebrow text-white/50">Working budget</span>
          <span className="flex min-h-12 border border-white/15 bg-ink transition-colors hover:border-white/30 focus-within:border-acid">
            <input
              name="currency"
              aria-label="Budget currency"
              defaultValue="PHP"
              list="budget-currencies"
              maxLength={3}
              pattern="[A-Za-z]{3}"
              title="Enter a 3-letter currency code, such as PHP, USD, or EUR"
              className="w-16 shrink-0 border-r border-white/10 bg-ink px-2 text-base font-semibold text-acid outline-none sm:w-[4.75rem] sm:text-xs"
            />
            <datalist id="budget-currencies">
              <option value="PHP" />
              <option value="USD" />
              <option value="EUR" />
              <option value="GBP" />
              <option value="AUD" />
              <option value="SGD" />
              <option value="JPY" />
            </datalist>
            <input
              name="budget"
              aria-label="Working budget amount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="Enter an amount"
              className="min-w-0 flex-1 bg-transparent px-3 text-base font-medium text-white outline-none placeholder:text-white/20 sm:px-4 sm:text-sm"
            />
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="eyebrow text-white/50">Ideal timeline</span>
          <input
            name="timeline"
            aria-label="Ideal timeline"
            type="text"
            placeholder="e.g. Start in June, launch in August"
            className="min-h-12 border border-white/15 bg-ink px-4 text-base font-medium text-white outline-none placeholder:text-white/20 hover:border-white/30 focus:border-acid sm:text-sm"
          />
        </label>
      </div>

      {state.status === "error" && (
        <p className="mono text-sm text-red-400" aria-live="polite">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="mono flex flex-wrap gap-x-4 gap-y-2 text-[0.54rem] uppercase tracking-wider text-white/35">
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3 w-3 text-acid" /> We reply within 24 hours
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-acid" /> No pressure
          </span>
        </div>
        <StarBorder
          as="button"
          disabled={pending}
          className="w-full sm:w-auto sm:shrink-0"
        >
          {pending ? "Sending brief..." : "Start the conversation →"}
        </StarBorder>
      </div>
    </form>
  );
}
