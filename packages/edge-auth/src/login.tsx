'use client'

import { useState, type FormEvent } from 'react'

export function LoginForm({ title }: { title: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        setError(response.status === 429 ? 'Too many attempts. Try again later.' : 'Email or password is incorrect.')
        return
      }
      window.location.assign('/')
    } catch {
      setError('Sign in is unavailable right now. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-neutral-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">ARKO</p>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        </div>
        <label className="block text-sm">
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-emerald-400" />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-emerald-400" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 font-semibold text-neutral-950 disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
