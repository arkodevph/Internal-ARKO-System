import { NextRequest, NextResponse } from 'next/server'

export type Application = 'finance' | 'portal' | 'internal' | 'pm'

type Tokens = { accessToken: string; refreshToken: string }
const pendingRefreshes = new Map<string, Promise<Tokens | null>>()

function apiUrl() {
  const url = process.env.ARKO_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3003' : '')
  if (!url) throw new Error('ARKO_API_URL is required')
  return url.replace(/\/$/, '')
}

function cookieName(application: Application, kind: 'access' | 'refresh' | 'access_until') {
  const prefix = process.env.NODE_ENV === 'production' ? '__Host-' : ''
  return `${prefix}arko_${application}_${kind}`
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

function setTokens(response: NextResponse, application: Application, tokens: Tokens) {
  response.cookies.set(cookieName(application, 'access'), tokens.accessToken, cookieOptions(15 * 60))
  response.cookies.set(cookieName(application, 'refresh'), tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60))
  response.cookies.set(cookieName(application, 'access_until'), String(Date.now() + 15 * 60 * 1000), cookieOptions(15 * 60))
}

function clearTokens(response: NextResponse, application: Application) {
  for (const kind of ['access', 'refresh', 'access_until'] as const) {
    response.cookies.set(cookieName(application, kind), '', cookieOptions(0))
  }
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return origin !== null && origin === request.nextUrl.origin
}

async function refresh(request: NextRequest, application: Application): Promise<Tokens | null> {
  const refreshToken = request.cookies.get(cookieName(application, 'refresh'))?.value
  if (!refreshToken) return null
  const key = `${application}:${refreshToken}`
  const pending = pendingRefreshes.get(key)
  if (pending) return pending
  const current = (async () => {
    const response = await fetch(`${apiUrl()}/api/identity/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, application }),
      cache: 'no-store',
    })
    return response.ok ? response.json() as Promise<Tokens> : null
  })()
  pendingRefreshes.set(key, current)
  try {
    const tokens = await current
    if (tokens) {
      // Requests already in flight may still carry the old cookie.
      setTimeout(() => pendingRefreshes.delete(key), 2_000)
    } else {
      pendingRefreshes.delete(key)
    }
    return tokens
  } catch (error) {
    pendingRefreshes.delete(key)
    throw error
  }
}

async function identitySession(accessToken: string, application: Application) {
  return fetch(`${apiUrl()}/api/identity/session`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-arko-application': application,
    },
    cache: 'no-store',
  })
}

export async function login(request: NextRequest, application: Application) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
  }
  const remote = await fetch(`${apiUrl()}/api/identity/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password, application }),
    cache: 'no-store',
  })
  if (!remote.ok) {
    return NextResponse.json({ error: remote.status === 429 ? 'Too many attempts' : 'Invalid credentials' },
      { status: remote.status === 429 ? 429 : 401 })
  }
  const tokens = await remote.json() as Tokens
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  setTokens(response, application, tokens)
  return response
}

export async function session(request: NextRequest, application: Application) {
  let accessToken = request.cookies.get(cookieName(application, 'access'))?.value
  let tokens: Tokens | null = null
  let remote = accessToken ? await identitySession(accessToken, application) : null
  if (!remote?.ok) {
    tokens = await refresh(request, application)
    accessToken = tokens?.accessToken
    remote = accessToken ? await identitySession(accessToken, application) : null
  }
  if (!remote?.ok) {
    const response = NextResponse.json(null, { headers: { 'Cache-Control': 'no-store' } })
    clearTokens(response, application)
    return response
  }
  const response = NextResponse.json(await remote.json(), { headers: { 'Cache-Control': 'no-store' } })
  if (tokens) setTokens(response, application, tokens)
  return response
}

export async function logout(request: NextRequest, application: Application) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  const refreshToken = request.cookies.get(cookieName(application, 'refresh'))?.value
  if (refreshToken) {
    await fetch(`${apiUrl()}/api/identity/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, application }),
      cache: 'no-store',
    })
  }
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  clearTokens(response, application)
  return response
}

export async function proxyTRPC(request: NextRequest, application: Application) {
  if (request.method !== 'GET' && !sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }
  const path = request.nextUrl.pathname.slice('/api/trpc/'.length)
  if (!path || path.includes('..')) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  const url = `${apiUrl()}/api/trpc/${path}${request.nextUrl.search}`
  const body = request.method === 'GET' ? undefined : await request.text()
  let accessToken = request.cookies.get(cookieName(application, 'access'))?.value
  let tokens: Tokens | null = null
  const accessUntil = Number(request.cookies.get(cookieName(application, 'access_until'))?.value || 0)
  if (!accessToken || accessUntil <= Date.now() + 30_000) {
    tokens = await refresh(request, application)
    accessToken = tokens?.accessToken
  }
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const forward = (token: string) => fetch(url, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': request.headers.get('content-type') || 'application/json',
    },
    body,
    cache: 'no-store',
  })
  let remote = await forward(accessToken)
  if (remote.status === 401 && !tokens) {
    tokens = await refresh(request, application)
    if (tokens) remote = await forward(tokens.accessToken)
  }
  const response = new NextResponse(await remote.text(), {
    status: remote.status,
    headers: {
      'Content-Type': remote.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  })
  if (tokens) setTokens(response, application, tokens)
  return response
}
