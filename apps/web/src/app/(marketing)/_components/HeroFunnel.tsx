"use client";

import { useState } from "react";
import { useLenis } from "lenis/react";

export default function HeroFunnel() {
  const [idea, setIdea] = useState("");
  const lenis = useLenis();

  const scrollToContact = () => {
    window.dispatchEvent(
      new CustomEvent("arko:funnel", { detail: idea.trim() }),
    );

    const message = document.querySelector<HTMLTextAreaElement>(
      '#contact-form textarea[name="message"]',
    );
    const destination =
      message ??
      document.getElementById("contact-form") ??
      document.getElementById("contact");
    if (!destination) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const focusMessage = () => message?.focus({ preventScroll: true });

    if (lenis) {
      lenis.scrollTo(destination, {
        offset: message
          ? -Math.max(72, (window.innerHeight - message.offsetHeight) / 2)
          : -72,
        immediate: reducedMotion,
        onComplete: focusMessage,
      });
    } else {
      destination.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "center",
      });
      focusMessage();
    }
  };

  return (
    <div className="flex w-full max-w-lg flex-col items-stretch border-4 border-ink min-[360px]:flex-row">
      <input
        type="text"
        aria-label="What are you building?"
        placeholder="what are you building?"
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-sm font-medium text-ink outline-none placeholder:text-ink/30"
        onKeyDown={(e) => {
          if (e.key === "Enter") scrollToContact();
        }}
      />
      <button
        type="button"
        onClick={scrollToContact}
        className="cursor-pointer border-t-4 border-ink bg-ink px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-acid transition-none hover:bg-ink/80 min-[360px]:border-l-4 min-[360px]:border-t-0"
      >
        Tell us
      </button>
    </div>
  );
}
