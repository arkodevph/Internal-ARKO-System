import { afterEach, describe, expect, it, jest } from '@jest/globals'

const findFirst = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: { landingContent: { findFirst } },
}))
jest.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}))

import { DEFAULT_LANDING_CONTENT } from '../content'
import { loadLandingContent } from '../get-content'

const originalDatabaseUrl = process.env.DATABASE_URL
const originalVercel = process.env.VERCEL

afterEach(() => {
  jest.restoreAllMocks()
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = originalDatabaseUrl
  if (originalVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = originalVercel
})

describe('landing content loader', () => {
  it('uses default content without initializing Prisma when DATABASE_URL is absent', async () => {
    delete process.env.DATABASE_URL

    await expect(loadLandingContent()).resolves.toEqual(DEFAULT_LANDING_CONTENT)
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('loads stored content when the database is configured', async () => {
    process.env.DATABASE_URL = 'postgresql://example.test/arko'
    findFirst.mockResolvedValue({ content: { hero: { eyebrow: 'Stored' } } })

    const content = await loadLandingContent()

    expect(findFirst).toHaveBeenCalledWith({ where: { singleton: true } })
    expect(content.hero.eyebrow).toBe('Stored')
  })

  it('uses default content when the configured database is unreachable', async () => {
    process.env.DATABASE_URL = 'postgresql://example.test/arko'
    findFirst.mockRejectedValue(new Error('Database unavailable'))

    await expect(loadLandingContent()).resolves.toEqual(DEFAULT_LANDING_CONTENT)
  })

  it('reads the Render public API on Vercel without querying Prisma', async () => {
    process.env.VERCEL = '1'
    process.env.DATABASE_URL = 'postgresql://example.test/arko'
    findFirst.mockClear()
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ hero: { eyebrow: 'Remote' } }), { status: 200 }),
    )

    const content = await loadLandingContent()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.arkodevph.com/api/landing/content',
      { cache: 'no-store' },
    )
    expect(findFirst).not.toHaveBeenCalled()
    expect(content.hero.eyebrow).toBe('Remote')
  })
})
