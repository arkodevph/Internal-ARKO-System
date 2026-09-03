import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "../_components/Breadcrumbs";

const TITLE = "Privacy Policy - Arko";
const DESCRIPTION =
  "Read how Arko collects, uses, stores, and protects information submitted through our website, including contact details, analytics data, and cookies.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    url: "/privacy",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/social-card?v=4",
        width: 1200,
        height: 630,
        alt: "Arko privacy policy",
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

const LAST_UPDATED = "August 10, 2026";

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        Arko is a software studio based in the Philippines, working with clients
        worldwide. This policy covers information handled through this website
        (arkodevph.com). You can reach us any time at{" "}
        <a
          href="mailto:contact@arkodevph.com"
          className="text-acid underline underline-offset-4"
        >
          contact@arkodevph.com
        </a>
        .
      </p>
    ),
  },
  {
    heading: "What we collect",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Details you submit</strong> through our contact form - your
          name, email, and the project information you choose to share (project
          type, budget, timeline, and message).
        </li>
        <li>
          <strong>Usage data</strong> collected automatically, such as pages
          viewed and general device and browser information, via analytics
          cookies.
        </li>
      </ul>
    ),
  },
  {
    heading: "How we use it",
    body: (
      <p>
        We use the information you send to respond to your enquiry, scope
        potential work, and stay in touch about your project. Usage data helps
        us understand how the site is used and improve it. We do not sell your
        personal information, and we do not use it for unrelated marketing.
      </p>
    ),
  },
  {
    heading: "Service providers",
    body: (
      <p>
        We rely on a small number of trusted providers to run this site and
        respond to you: hosting and delivery through Vercel, transactional email
        delivery through Resend, and website analytics through Google Analytics.
        These providers process data on our behalf and only as needed to provide
        their service.
      </p>
    ),
  },
  {
    heading: "Cookies & analytics",
    body: (
      <p>
        We use Google Analytics to measure traffic and understand how visitors
        use the site. This sets cookies in your browser. You can block or delete
        cookies through your browser settings, or use a browser extension to opt
        out of Google Analytics, without losing access to the site.
      </p>
    ),
  },
  {
    heading: "Data retention",
    body: (
      <p>
        We keep enquiry details only as long as needed to follow up on your
        project or as required for our records, then delete them. You can ask us
        to delete your information at any time.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        You can ask us to access, correct, or delete the personal information we
        hold about you. Email{" "}
        <a
          href="mailto:contact@arkodevph.com"
          className="text-acid underline underline-offset-4"
        >
          contact@arkodevph.com
        </a>{" "}
        and we will respond promptly.
      </p>
    ),
  },
  {
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the site or our practices change. The
        &ldquo;last updated&rdquo; date above reflects the most recent revision.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div id="top" className="bg-ink text-white">
      <section
        data-bg="light"
        className="relative overflow-hidden bg-acid px-6 pb-20 pt-32 text-ink md:px-10 md:pb-24 md:pt-44"
      >
        <div className="project-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-[90rem]">
          <Breadcrumbs
            className="text-ink"
            items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
          />
          <h1 className="display mt-8 text-[clamp(3rem,10vw,8rem)] leading-[0.85]">
            Privacy
            <br />
            Policy
          </h1>
          <p className="mono mt-6 text-xs font-bold uppercase tracking-[0.16em] text-ink/55">
            Last updated {LAST_UPDATED}
          </p>
        </div>
      </section>

      <section className="px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-3xl space-y-12">
          {SECTIONS.map((section) => (
            <div
              key={section.heading}
              id={
                section.heading === "Cookies & analytics"
                  ? "cookies"
                  : section.heading === "Changes to this policy"
                    ? "terms"
                    : undefined
              }
            >
              <h2 className="display text-3xl md:text-4xl">
                {section.heading}
              </h2>
              <div className="mt-4 text-base font-medium leading-relaxed text-white/65">
                {section.body}
              </div>
            </div>
          ))}

          <div className="border-t border-white/15 pt-8">
            <Link
              href="/#contact"
              className="mono inline-flex border-2 border-acid px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-acid transition-colors hover:bg-acid hover:text-ink"
            >
              Start a project →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
