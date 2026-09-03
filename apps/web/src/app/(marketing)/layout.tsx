import type { Metadata } from "next";
import SiteHeader from "./_components/SiteHeader";
import SmoothScrollProvider from "./_components/SmoothScrollProvider";
import Preloader from "./_components/Preloader";
import StickyMobileCta from "./_components/StickyMobileCta";
import MarketingPageTransition from "./_components/MarketingPageTransition";
import FloatingAssistant from "./_components/FloatingAssistant";

const TITLE = "Arko - We build web, mobile, automation and AI";
const DESCRIPTION =
  "Arko is a small software studio. We design and ship web and mobile products, then wire in the automation and AI that make them run on their own.";

export const metadata: Metadata = {
  metadataBase: new URL("https://arkodevph.com"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Arko",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/social-card?v=4",
        width: 1200,
        height: 630,
        alt: "Arko Software Studio",
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

const BASE = "https://arkodevph.com";

const SCHEMA_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${BASE}/#organization`,
      name: "Arko",
      alternateName: "Arko Software Studio",
      url: BASE,
      email: "contact@arkodevph.com",
      description: DESCRIPTION,
      slogan: "We build web, mobile, automation and AI",
      logo: `${BASE}/icon.png`,
      foundingDate: "2025",
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@arkodevph.com",
        contactType: "sales",
      },
      sameAs: ["https://github.com/justrhey"],
      address: {
        "@type": "PostalAddress",
        addressCountry: "PH",
      },
      areaServed: "Worldwide",
      knowsAbout: [
        "Web development",
        "Mobile app development",
        "Automation",
        "Artificial intelligence",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      url: BASE,
      name: "Arko",
      publisher: { "@id": `${BASE}/#organization` },
    },
  ],
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="landing-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_JSONLD) }}
      />
      <Preloader />
      <a
        href="#main-content"
        className="sr-only z-[200] bg-ink px-4 py-3 text-acid focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <MarketingPageTransition>
        <SmoothScrollProvider>
          <SiteHeader />
          <main id="main-content">{children}</main>
        </SmoothScrollProvider>
        <FloatingAssistant />
        <StickyMobileCta />
      </MarketingPageTransition>
    </div>
  );
}
