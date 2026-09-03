import Image from 'next/image'

const TEAM = [
  {
    number: '01',
    name: 'Justine Rhey',
    image: '/team/justine-rhey-professional.webp',
    portfolio: 'https://justinerhey.arkodevph.com',
    offset: 'lg:mt-0',
    tilt: 'lg:-rotate-2',
  },
  {
    number: '02',
    name: 'Rovic',
    image: '/team/rovic-professional.webp',
    portfolio: 'https://ecxiiii.github.io/portfolio/',
    offset: 'sm:mt-6 lg:mt-10',
    tilt: 'lg:rotate-2',
  },
  {
    number: '03',
    name: 'Ralph',
    image: '/team/ralph-professional.webp',
    portfolio: 'https://ralphrowel.github.io/',
    offset: 'lg:mt-4',
    tilt: 'lg:-rotate-1',
  },
  {
    number: '04',
    name: 'Justine Cane',
    image: '/team/justine-cane-professional.webp',
    portfolio: 'https://jayceebacurin.arkodevph.com',
    offset: 'sm:mt-6 lg:mt-14',
    tilt: 'lg:rotate-2',
  },
]

export default function TeamSection() {
  return (
    <section
      id="team"
      aria-labelledby="team-heading"
      data-bg="light"
      className="relative overflow-hidden border-y-4 border-ink bg-acid px-6 pb-0 pt-20 text-ink md:px-10 md:pt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div
        aria-hidden
        className="display pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[20vw] leading-none text-ink/[0.055]"
      >
        THE TEAM
      </div>
      <div className="relative mx-auto max-w-[75rem]">
        <header className="mx-auto max-w-3xl border-y-4 border-ink py-8 text-center md:py-10">
          <p className="eyebrow inline-flex border-2 border-ink bg-ink px-4 py-2 text-acid">
            The people behind Arko
          </p>
          <h2
            id="team-heading"
            className="display mt-5 text-[clamp(3.25rem,7vw,6.25rem)] leading-[0.82]"
          >
            Meet the team
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-ink/70 md:text-lg">
            We&apos;re a small team that designs, builds, and ships together. You
            work directly with the people making the product - without an account
            layer between you and the work.
          </p>
        </header>

        <div className="my-10 flex items-center justify-center gap-5 md:my-12">
          <span aria-hidden className="h-1 w-12 bg-ink md:w-16" />
          <p className="eyebrow text-ink/60">
            Our team
          </p>
          <span aria-hidden className="h-1 w-12 bg-ink md:w-16" />
        </div>

        <div className="grid grid-cols-1 items-start gap-12 sm:grid-cols-2 sm:gap-x-9 sm:gap-y-14 lg:grid-cols-4 lg:gap-7">
          {TEAM.map((member) => (
            <a
              key={member.name}
              href={member.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${member.name}'s portfolio`}
              className={`group relative mx-auto flex w-full max-w-56 cursor-pointer flex-col border-4 border-ink bg-paper p-2.5 pb-3.5 text-left shadow-[8px_8px_0_#0a0a0a] outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[12px_12px_0_#0a0a0a] focus-visible:-translate-y-1.5 focus-visible:rotate-0 focus-visible:shadow-[12px_12px_0_#0a0a0a] focus-visible:ring-4 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-acid motion-reduce:transition-none ${member.offset} ${member.tilt}`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden border-2 border-ink bg-ink/10">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 42vw, 80vw"
                  className="object-cover grayscale transition duration-300 group-hover:scale-105 group-hover:grayscale-0 group-focus-visible:scale-105 group-focus-visible:grayscale-0 motion-reduce:transition-none"
                />
                <span className="mono absolute left-0 top-0 border-b-2 border-r-2 border-ink bg-ink px-3 py-2 text-xs font-bold text-acid">
                  ARKO / {member.number}
                </span>
              </div>

              <span className="mt-3.5 flex w-full items-end justify-between gap-3">
                <span className="display text-xl leading-none md:text-2xl">
                  {member.name}
                </span>
                <span className="mono shrink-0 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink/50">
                  Portfolio
                </span>
              </span>

              <span className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center border-2 border-ink bg-acid text-ink transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:translate-x-1 motion-reduce:transition-none">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        <p className="eyebrow mt-16 text-center text-ink/55">
          Based in the Philippines · Working worldwide
        </p>
      </div>

    </section>
  )
}
