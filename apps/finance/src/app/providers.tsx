'use client'

import { SessionProvider } from 'next-auth/react'
import { TRPCProvider } from '../../../web/src/lib/trpc/TRPCProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/auth"><TRPCProvider>{children}</TRPCProvider></SessionProvider>
}
