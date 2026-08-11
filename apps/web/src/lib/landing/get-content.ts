import { unstable_cache } from 'next/cache'
import { prisma } from '@arko/db'
import { mergeLandingContent, type LandingContent } from './content'

/** Cache tag busted by the admin `landing.update` mutation for on-demand revalidation. */
export const LANDING_CACHE_TAG = 'landing-content'

/**
 * Read the singleton landing content for Server Components (the public marketing
 * page). Wrapped in `unstable_cache` so the page stays statically cached and is
 * revalidated on demand when an admin saves. Falls back to defaults when no row
 * exists yet, so the page renders identically before the first admin save.
 */
export const getLandingContent = unstable_cache(
  async (): Promise<LandingContent> => {
    const row = await prisma.landingContent.findFirst({ where: { singleton: true } })
    return mergeLandingContent(row?.content)
  },
  ['landing-content-v3'],
  // Tag-based revalidation is immediate on admin save; the time window is a
  // self-heal fallback so a changed content shape can't stay cached indefinitely.
  { tags: [LANDING_CACHE_TAG], revalidate: 3600 },
)
