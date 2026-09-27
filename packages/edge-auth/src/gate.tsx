'use client'

import { useEffect, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession()
  useEffect(() => {
    if (status === 'unauthenticated') window.location.replace('/login')
  }, [status])
  if (status !== 'authenticated') {
    return <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-300">Checking your session…</main>
  }
  return children
}

export function SignOutButton() {
  return <button className="text-sm text-neutral-400 hover:text-white" onClick={async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/login')
  }}>Sign out</button>
}
