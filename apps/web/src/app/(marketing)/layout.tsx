import type { Metadata } from 'next'
import SiteHeader from './_components/SiteHeader'
import SmoothScrollProvider from './_components/SmoothScrollProvider'
import Preloader from './_components/Preloader'
import StickyMobileCta from './_components/StickyMobileCta'

const TITLE = 'Arko — We build web, mobile, automation and AI'
const DESCRIPTION =
  'Arko is a small software studio. We design and ship web and mobile products, then wire in the automation and AI that make them run on their own.'

export const metadata: Metadata = {
  metadataBase: new URL('https://arkodevph.vercel.app'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Arko',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

const BASE = 'https://arkodevph.vercel.app'

const SCHEMA_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'ProfessionalService'],
      '@id': `${BASE}/#organization`,
      name: 'Arko',
      alternateName: 'Arko Software Studio',
      url: BASE,
      email: 'arkodevph@gmail.com',
      description: DESCRIPTION,
      slogan: 'We build web, mobile, automation and AI',
      sameAs: ['https://github.com/justrhey'],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PH',
      },
      areaServed: 'Worldwide',
      knowsAbout: [
        'Web development',
        'Mobile app development',
        'Automation',
        'Artificial intelligence',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE}/#website`,
      url: BASE,
      name: 'Arko',
      publisher: { '@id': `${BASE}/#organization` },
    },
  ],
}

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
      <SmoothScrollProvider>
        <SiteHeader />
        <main>{children}</main>
      </SmoothScrollProvider>
      <StickyMobileCta />
    </div>
  )
}
