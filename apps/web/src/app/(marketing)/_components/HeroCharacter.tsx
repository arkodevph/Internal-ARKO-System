"use client";

import { useEffect, useRef } from "react";

export default function HeroCharacter() {
  const characterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const character = characterRef.current;
    const hero = character?.closest<HTMLElement>("#top");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!character || !hero || reducedMotion.matches || !finePointer.matches) {
      return;
    }

    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      character.style.transform = "translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)";
    };
    const move = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        character.style.transform = `translate3d(${x * 18}px, ${y * 10 - 8}px, 0) rotateX(${-y * 5}deg) rotateY(${x * 8}deg)`;
      });
    };

    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div
      ref={characterRef}
      className="will-change-transform transition-transform duration-300 ease-out"
      style={{ transformStyle: "preserve-3d" }}
    >
      <video
        className="block h-auto w-full"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero/arko-hero-transparent.png"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/hero/arko-hero-transparent.webm" type="video/webm" />
      </video>
    </div>
  );
}
