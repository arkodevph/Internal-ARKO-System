"use client";

import { useEffect, useRef } from "react";

export default function HeroCharacter({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pause();
    }
  }, []);

  return (
    <video
      ref={ref}
      className={`block h-auto w-full mix-blend-lighten ${className ?? ""}`}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/hero/anime-sleeping-poster.jpg"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/hero/anime-sleeping.mp4" type="video/mp4" />
    </video>
  );
}
