import { afterEach, describe, expect, it } from '@jest/globals'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

const originalSurface = process.env.ARKO_SURFACE
const originalInternalUrl = process.env.ARKO_INTERNAL_URL

afterEach(() => {
  process.env.ARKO_SURFACE = originalSurface
  process.env.ARKO_INTERNAL_URL = originalInternalUrl
})

describe('Render surfaces', () => {
  it('keeps the landing page on the site and sends login to the app', () => {
    process.env.ARKO_SURFACE = 'site'
    process.env.ARKO_INTERNAL_URL = 'https://app.arkodevph.com'

    expect(middleware(new NextRequest('https://arkodevph.com/')).status).toBe(200)
    expect(middleware(new NextRequest('https://arkodevph.com/auth/login')).headers.get('location'))
      .toBe('https://app.arkodevph.com/auth/login')
    expect(middleware(new NextRequest('https://arkodevph.com/dashboard/finance')).headers.get('location'))
      .toBe('https://app.arkodevph.com/dashboard/finance')
  })

  it('sends the unified app root to its dashboard', () => {
    process.env.ARKO_SURFACE = 'unified'

    expect(middleware(new NextRequest('https://app.arkodevph.com/')).headers.get('location'))
      .toBe('https://app.arkodevph.com/dashboard')
  })

  it('allows only the public API routes on the site', () => {
    process.env.ARKO_SURFACE = 'site'

    expect(middleware(new NextRequest('https://arkodevph.com/api/landing/content')).status).toBe(200)
    expect(middleware(new NextRequest('https://arkodevph.com/api/trpc')).status).toBe(404)
  })
})
