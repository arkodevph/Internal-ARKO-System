import { unstable_cache } from 'next/cache'
import { prisma } from '@arko/db'
import { mergeLandingContent, type LandingContent } from './content'
import { publicApiUrl } from '../public-api'

/** Cache tag busted by the admin `landing.update` mutation for on-demand revalidation. */
export const LANDING_CACHE_TAG = 'landing-content'

export async function loadLandingContent(): Promise<LandingContent> {
  if (process.env.ARKO_SURFACE === 'site') {
    try {
      const response = await fetch(publicApiUrl('/api/landing/content'), { cache: 'no-store' })
      if (!response.ok) throw new Error('Landing content API unavailable')
      return mergeLandingContent(await response.json())
    } catch {
      return mergeLandingContent(undefined)
    }
  }
  if (!process.env.DATABASE_URL) return mergeLandingContent(undefined)

  try {
    const row = await prisma.landingContent.findFirst({ where: { singleton: true } })
    return mergeLandingContent(row?.content)
  } catch {
    return mergeLandingContent(undefined)
  }
}

/**
 * Read the singleton landing content for Server Components (the public marketing
 * page). Wrapped in `unstable_cache` so the page stays statically cached and is
 * revalidated on demand when an admin saves. Falls back to defaults when no row
 * exists yet, so the page renders identically before the first admin save.
 */
export const getLandingContent = unstable_cache(
  loadLandingContent,
  ['landing-content-v3'],
  // Tag-based revalidation is immediate on admin save; the time window is a
  // self-heal fallback so a changed content shape can't stay cached indefinitely.
  { tags: [LANDING_CACHE_TAG], revalidate: 3600 },
)
