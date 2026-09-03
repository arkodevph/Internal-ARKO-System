import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "../../_components/Breadcrumbs";

const TITLE = "Client document workflow - Arko project system";
const DESCRIPTION =
  "A product walkthrough of Arko’s project-to-document workflow: editable invoices, agreements, proposals, timelines, private links, and printable PDF handoff.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/projects/client-document-workflow" },
  openGraph: {
    type: "article",
    url: "/projects/client-document-workflow",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/social-card?v=4",
        width: 1200,
        height: 630,
        alt: "Arko client document workflow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/social-card?v=4"],
  },
};

const STEPS = [
  {
    number: "01",
    label: "Project setup",
    title: "One source, not four disconnected files.",
    copy: "Client, project, deliverable, and milestone data form the starting point. Missing commercial or legal details remain visible instead of being guessed.",
  },
  {
    number: "02",
    label: "Draft",
    title: "A boilerplate that expects an editor.",
    copy: "Choose an invoice, agreement, proposal, or timeline. The structure arrives filled where the project is factual and marked where a human decision is still required.",
  },
  {
    number: "03",
    label: "Review",
    title: "The document and its decisions stay together.",
    copy: "Edit narrative sections, dates, parties, milestones, currency, line items, dependencies, and approval points while seeing the client-facing sheet.",
  },
  {
    number: "04",
    label: "Handoff",
    title: "Publish once. Share one private link.",
    copy: "A published document gets a client route that can be replaced when access must be revoked. Draft and archived records stay private.",
  },
  {
    number: "05",
    label: "PDF",
    title: "The browser chrome disappears. The document remains.",
    copy: "The shared A4 print system preserves tables, sections, totals, and timeline context for a clean Save-as-PDF handoff.",
  },
];

const TEMPLATES = [
  [
    "Invoice",
    "Parties / dates / line items / currency / total / payment instructions",
  ],
  [
    "Agreement",
    "Scope / responsibilities / payment / IP / revisions / termination / signatures",
  ],
  [
    "Proposal",
    "Context / objectives / deliverables / schedule / pricing / assumptions / approval",
  ],
  [
    "Timeline",
    "Milestones / dates / status / dependencies / feedback / sign-off",
  ],
];

function DocumentArtifact() {
  return (
    <div
      className="project-document-artifact"
      aria-label="Illustration of the generated client document"
    >
      <div className="flex items-start justify-between border-b-[3px] border-ink pb-6">
        <div>
          <div className="mono text-[0.55rem] font-bold uppercase tracking-[0.18em]">
            ARKO / CLIENT DOCUMENT
          </div>
          <div className="mt-3 text-3xl font-black leading-none tracking-[-0.05em] md:text-5xl">
            PROJECT
            <br />
            TIMELINE
          </div>
        </div>
        <div className="mono text-right text-[0.55rem] uppercase leading-5">
          <div>Issued / Set</div>
          <div>Target / Set</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="border border-ink p-3">
          <span className="mono text-[0.5rem] uppercase">From</span>
          <div className="mt-2 h-2 w-2/3 bg-ink" />
          <div className="mt-2 h-1 w-1/2 bg-ink/30" />
        </div>
        <div className="border border-ink p-3">
          <span className="mono text-[0.5rem] uppercase">Prepared for</span>
          <div className="mt-2 h-2 w-3/4 bg-ink" />
          <div className="mt-2 h-1 w-1/2 bg-ink/30" />
        </div>
      </div>
      <ol className="mt-7 border-t-2 border-ink">
        {["Discovery approved", "Build and integration", "Client sign-off"].map(
          (item, index) => (
            <li
              key={item}
              className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 border-b border-ink py-4"
            >
              <span className="mono text-lg font-bold">0{index + 1}</span>
              <strong className="text-xs uppercase">{item}</strong>
              <span className="mono text-[0.5rem] uppercase">
                {index === 0 ? "Done" : "Review"}
              </span>
            </li>
          ),
        )}
      </ol>
      <div className="mt-8 flex justify-between border-t-[3px] border-ink pt-3">
        <span className="mono text-[0.5rem] uppercase">
          One source → one handoff
        </span>
        <span className="h-3 w-3 bg-acid outline outline-2 outline-ink" />
      </div>
    </div>
  );
}

export default function ClientDocumentWorkflowPage() {
  return (
    <div id="top" className="bg-ink text-white">
      <section
        data-bg="light"
        className="relative min-h-screen overflow-hidden bg-acid px-6 pb-20 pt-32 text-ink md:px-10 md:pb-28 md:pt-44"
      >
        <div className="project-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-[90rem]">
          <Breadcrumbs
            className="text-ink"
            items={[
              { label: "Home", href: "/" },
              { label: "Projects", href: "/projects" },
              { label: "Client document workflow" },
            ]}
          />
          <div className="mt-10 grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow text-ink/60">Project → document → client</p>
              <h1 className="display mt-5 max-w-5xl text-[clamp(4rem,11vw,10rem)]">
                The handoff is the product.
              </h1>
              <p className="mt-8 max-w-xl text-lg font-semibold leading-relaxed text-ink/75 md:text-2xl">
                A working document system that turns project facts into editable
                client material - then carries it through review, private
                sharing, and PDF output.
              </p>
            </div>
            <div className="relative lg:translate-y-24">
              <div
                className="absolute -left-4 -top-4 h-full w-full border-4 border-ink"
                aria-hidden
              />
              <DocumentArtifact />
            </div>
          </div>
        </div>
      </section>

      <section
        className="grid border-y-4 border-acid bg-ink md:grid-cols-3"
        aria-label="System capabilities"
      >
        {[
          ["04", "document structures"],
          ["01", "private client route"],
          ["A4", "print-ready output"],
        ].map(([value, label], index) => (
          <div
            key={label}
            className={`p-8 md:p-10 ${index ? "border-t-4 border-acid md:border-l-4 md:border-t-0" : ""}`}
          >
            <div className="display text-6xl text-acid">{value}</div>
            <div className="eyebrow mt-3 text-white/45">{label}</div>
          </div>
        ))}
      </section>

      <section className="px-6 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[90rem]">
          <div className="grid gap-8 border-b border-white/20 pb-14 md:grid-cols-[0.7fr_1.3fr]">
            <div className="eyebrow text-acid">The workflow</div>
            <h2 className="display max-w-5xl text-[clamp(3rem,8vw,7rem)]">
              Not a gallery. A chain of custody.
            </h2>
          </div>
          <ol className="relative md:ml-[18%]">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="group grid gap-6 border-b border-white/20 py-12 md:grid-cols-[6rem_0.7fr_1.3fr] md:py-16"
              >
                <div className="mono text-4xl font-bold text-acid/25 transition-colors group-hover:text-acid">
                  {step.number}
                </div>
                <div>
                  <div className="eyebrow text-acid">{step.label}</div>
                  <h3 className="display mt-3 text-3xl md:text-5xl">
                    {step.title}
                  </h3>
                </div>
                <p className="max-w-xl self-end text-base font-medium leading-relaxed text-white/55 md:text-lg">
                  {step.copy}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        data-bg="light"
        className="bg-paper px-6 py-24 text-ink md:px-10 md:py-36"
      >
        <div className="mx-auto max-w-[90rem]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="eyebrow text-ink/50">Four structures</div>
              <h2 className="display mt-4 text-[clamp(3.5rem,8vw,7rem)]">
                Enough shape. No invented facts.
              </h2>
              <p className="mt-6 max-w-md text-base font-semibold leading-relaxed text-ink/65">
                Each draft starts useful, stays visibly incomplete where
                business decisions are missing, and refuses publication until
                required details are resolved.
              </p>
            </div>
            <div className="border-4 border-ink">
              {TEMPLATES.map(([name, anatomy], index) => (
                <div
                  key={name}
                  className={`group grid gap-5 p-6 md:grid-cols-[4rem_0.7fr_1.3fr] md:p-8 ${index ? "border-t-4 border-ink" : ""}`}
                >
                  <span className="mono text-xs font-bold">0{index + 1}</span>
                  <h3 className="display text-3xl md:text-5xl">{name}</h3>
                  <p className="mono self-center text-xs font-semibold uppercase leading-6 text-ink/55">
                    {anatomy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 md:py-36">
        <div className="mx-auto grid max-w-[90rem] gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="eyebrow text-acid">The boundary matters</div>
            <h2 className="display mt-4 text-[clamp(3.5rem,9vw,8rem)]">
              Automation stops where judgment starts.
            </h2>
          </div>
          <div className="self-end border-l-4 border-acid pl-6">
            <p className="text-xl font-semibold leading-relaxed text-white/75">
              No invented hourly rates. No assumed currency. No pretend legal
              certainty. No client claims dressed up as case-study metrics.
            </p>
            <p className="mono mt-8 text-xs uppercase leading-6 text-white/35">
              Project facts are reused. Missing commercial and legal decisions
              are marked. Publishing is a deliberate act.
            </p>
          </div>
        </div>
      </section>

      <section
        id="project-contact"
        data-bg="light"
        className="bg-acid px-6 py-24 text-ink md:px-10 md:py-32"
      >
        <div className="mx-auto flex max-w-[90rem] flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div>
            <div className="eyebrow text-ink/55">Need a system like this?</div>
            <h2 className="display mt-4 text-[clamp(3.5rem,10vw,8rem)]">
              Build the boring part brilliantly.
            </h2>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="mono border-4 border-ink px-7 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-ink/30"
            >
              See all projects
            </Link>
            <Link
              href="/#contact"
              className="mono border-4 border-ink bg-ink px-7 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-acid transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-ink/30"
            >
              Start a project →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
