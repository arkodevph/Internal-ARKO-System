import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import GoogleAnalytics from "./google-analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://arkodevph.com"),
  title: "Arko Software Studio | Web, Mobile, Automation and AI",
  description:
    "Arko is a Philippine software studio designing and building web products, mobile apps, automation systems, and practical AI tools for growing teams.",
  openGraph: {
    type: "website",
    siteName: "Arko",
    title: "Arko Software Studio | Web, Mobile, Automation and AI",
    description:
      "Arko designs and ships web products, mobile apps, automation systems, and practical AI tools for growing teams.",
    images: [
      {
        url: "/social-card?v=2",
        width: 1200,
        height: 630,
        alt: "Arko Software Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arko Software Studio | Web, Mobile, Automation and AI",
    description:
      "Arko designs and ships web products, mobile apps, automation systems, and practical AI tools for growing teams.",
    images: ["/social-card?v=2"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="llms" href="/llms.txt" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('arko-system-theme');var theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.systemTheme=theme}catch(e){document.documentElement.dataset.systemTheme='dark'}})()`,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
