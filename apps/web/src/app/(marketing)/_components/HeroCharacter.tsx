export default function HeroCharacter() {
  return (
    <video
      className="block h-auto w-full transition-transform duration-500 ease-out motion-safe:group-hover/hero:-translate-y-4 motion-safe:group-hover/hero:rotate-1 motion-safe:group-hover/hero:scale-[1.02] motion-reduce:transition-none"
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
  );
}
