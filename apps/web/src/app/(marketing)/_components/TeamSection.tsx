import Image from 'next/image'

// Drop the team photo at: apps/web/public/team/arko-team.jpg
// (any 4:3-ish landscape image works; update the src below if you use a
// different filename or format).
const TEAM_PHOTO = '/team/arko-team.jpg'

export default function TeamSection() {
  return (
    <section
      id="team"
      aria-labelledby="team-heading"
      data-bg="light"
      className="bg-acid px-6 py-24 text-ink md:px-10 md:py-32"
    >
      <div className="mx-auto grid max-w-[90rem] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="relative">
          <div
            aria-hidden
            className="absolute -left-4 -top-4 h-full w-full border-4 border-ink"
          />
          <div className="relative aspect-[4/3] overflow-hidden border-4 border-ink bg-ink">
            <Image
              src={TEAM_PHOTO}
              alt="The Arko team"
              fill
              sizes="(min-width:1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <p className="eyebrow text-ink/55">The team</p>
          <h2
            id="team-heading"
            className="display mt-4 text-[clamp(3rem,8vw,6.5rem)]"
          >
            Real people,
            <br />
            not a logo.
          </h2>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-relaxed text-ink/70 md:text-2xl">
            A small studio that designs, builds, and ships — you talk to the
            people writing the code, not an account layer between you and the
            work.
          </p>
          <p className="mono mt-8 text-xs font-bold uppercase tracking-[0.16em] text-ink/50">
            Based in the Philippines · Working worldwide
          </p>
        </div>
      </div>
    </section>
  )
}
