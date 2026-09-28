import type { LandingContent } from "@/lib/landing/content";
import ServicesGlobeLoader from "./ServicesGlobeLoader";

export default function ServicesSection({ label, slides, ctaLabel }: LandingContent["services"]) {
  return (
    <section id="services" aria-labelledby="services-heading" className="relative scroll-mt-20 overflow-hidden border-y border-acid/20 bg-ink px-6 py-20 text-white md:px-10 md:py-28">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between gap-6 border-b border-acid/20 pb-5">
          <p className="eyebrow text-acid">{label}</p>
          <span className="eyebrow text-right text-white/50">PH based / Globally connected</span>
        </div>

        <div className="grid items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-14">
          <div>
            <h2 id="services-heading" className="display text-[clamp(2.75rem,5.5vw,6rem)] leading-[0.98]">
              Built here.<br /><span className="text-acid">Ready for<br />everywhere.</span>
            </h2>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-white/65">
              Your next website, app, or system. Built by one team in the Philippines, wherever you do business.
            </p>
            <p className="mt-4 max-w-lg leading-relaxed text-white/65">
              Supporting clients nationwide, from Luzon to Mindanao, and remotely across Australia, Canada, and the United States.
            </p>
            <a href="#contact" className="eyebrow mt-8 inline-flex min-h-12 items-center border border-acid bg-acid px-6 py-4 font-bold text-ink transition-colors hover:bg-transparent hover:text-acid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid">
              {ctaLabel}
            </a>
          </div>
          <ServicesGlobeLoader />
        </div>

        <div className="grid border-l border-t border-acid/20 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((service, index) => (
            <div key={`${service.accent}-${index}`} className={`border-b border-r border-acid/20 p-6 md:p-8 ${service.resolve ? "bg-acid/5" : ""}`}>
              <span className="eyebrow text-acid/60">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 text-xl font-semibold leading-snug md:text-2xl">
                <span className="text-white/60">{service.lead}</span><br />
                <span className={service.resolve ? "text-acid" : "text-white"}>{service.accent}</span>
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
