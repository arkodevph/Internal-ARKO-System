import { afterEach, describe, expect, it } from '@jest/globals'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

const originalVercel = process.env.VERCEL

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
})

describe('public Vercel and system Render routing', () => {
  it('keeps the landing page on the root domain and sends login to the app', () => {
    expect(middleware(new NextRequest('https://arkodevph.com/')).status).toBe(200)
    expect(middleware(new NextRequest('https://arkodevph.com/auth/login?callbackUrl=%2Fdashboard')).headers.get('location'))
      .toBe('https://app.arkodevph.com/auth/login?callbackUrl=%2Fdashboard')
    expect(middleware(new NextRequest('https://arkodevph.com/dashboard/finance')).headers.get('location'))
      .toBe('https://app.arkodevph.com/dashboard/finance')
  })

  it('sends the app and Render fallback roots to the dashboard', () => {
    expect(middleware(new NextRequest('https://app.arkodevph.com/')).headers.get('location'))
      .toBe('https://app.arkodevph.com/dashboard')
    expect(middleware(new NextRequest('https://arko.onrender.com/')).headers.get('location'))
      .toBe('https://arko.onrender.com/dashboard')
    expect(middleware(new NextRequest('http://localhost:3000/')).status).toBe(200)
  })

  it('allows only the public API routes on the root domain', () => {
    expect(middleware(new NextRequest('https://arkodevph.com/api/landing/content')).status).toBe(200)
    expect(middleware(new NextRequest('https://arkodevph.com/api/trpc')).status).toBe(404)
    expect(middleware(new NextRequest('https://app.arkodevph.com/api/trpc')).status).toBe(200)
  })

  it('keeps Vercel preview deployments public-only', () => {
    process.env.VERCEL = '1'

    expect(middleware(new NextRequest('https://arko-preview.vercel.app/')).status).toBe(200)
    expect(middleware(new NextRequest('https://arko-preview.vercel.app/dashboard')).headers.get('location'))
      .toBe('https://app.arkodevph.com/dashboard')
    expect(middleware(new NextRequest('https://arko-preview.vercel.app/api/trpc')).status).toBe(404)
    expect(middleware(new NextRequest('https://arko-preview.vercel.app/api/landing/view')).status).toBe(200)
    expect(middleware(new NextRequest('https://arko-preview.vercel.app/health')).status).toBe(404)
  })
})
