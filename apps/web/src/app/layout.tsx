import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import GoogleAnalytics from './google-analytics'

export const metadata: Metadata = {
  title: 'Arko - Your Startup OS',
  description: 'Workflows, finance, and task management for your startup',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
