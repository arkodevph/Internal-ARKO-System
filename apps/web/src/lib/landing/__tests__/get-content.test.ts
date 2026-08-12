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

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = originalDatabaseUrl
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
})
