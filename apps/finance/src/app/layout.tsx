import type { Metadata } from 'next'
import { Providers } from './providers'
import '../../../web/src/app/globals.css'

export const metadata: Metadata = { title: 'ARKO Finance' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-background text-foreground"><Providers>{children}</Providers></body></html>
}
