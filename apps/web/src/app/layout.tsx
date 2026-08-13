import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import GoogleAnalytics from "./google-analytics";

export const metadata: Metadata = {
  title: "Arko - Your Startup OS",
  description: "Workflows, finance, and task management for your startup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('arko-system-theme');var theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.systemTheme=theme}catch(e){document.documentElement.dataset.systemTheme='dark'}})()`,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
