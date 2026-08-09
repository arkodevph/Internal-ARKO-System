import { describe, it, expect, jest } from '@jest/globals'

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
  unstable_cache: (fn: any) => fn,
}))

import { landingRouter } from '../landing'
import { DEFAULT_LANDING_CONTENT, landingContentSchema } from '../../../../lib/landing/content'

const ctx = (over: any = {}) => {
  let row: any = over._row ?? null
  return {
    user: { id: over.userId ?? 'admin1' },
    session: { user: { id: over.userId ?? 'admin1' } },
    userRole: over.userRole ?? 'ADMIN',
    prisma: {
      landingContent: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(row)),
        upsert: jest.fn().mockImplementation(({ create, update }: any) => {
          row = row ? { ...row, ...update } : { id: 'lc1', ...create }
          return Promise.resolve(row)
        }),
      },
    },
  } as any
}

describe('landing router', () => {
  describe('get', () => {
    it('returns defaults when no row exists yet', async () => {
      const res = await landingRouter.createCaller(ctx()).get()
      expect(res).toEqual(DEFAULT_LANDING_CONTENT)
    })
  })

  describe('update', () => {
    it('rejects non-admin users with FORBIDDEN', async () => {
      const c = ctx({ userRole: 'USER' })
      await expect(
        landingRouter.createCaller(c).update(DEFAULT_LANDING_CONTENT),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(c.prisma.landingContent.upsert).not.toHaveBeenCalled()
    })

    it('upserts the singleton and returns the saved content for admins', async () => {
      const c = ctx()
      const input = {
        ...DEFAULT_LANDING_CONTENT,
        hero: { ...DEFAULT_LANDING_CONTENT.hero, eyebrow: 'Changed eyebrow' },
      }
      const res = await landingRouter.createCaller(c).update(input)
      expect(c.prisma.landingContent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { singleton: true } }),
      )
      expect(res.hero.eyebrow).toBe('Changed eyebrow')
    })

    it('rejects dangerous URL schemes in link/asset fields (XSS defense)', async () => {
      const c = ctx()
      const malicious = {
        ...DEFAULT_LANDING_CONTENT,
        footer: { ...DEFAULT_LANDING_CONTENT.footer, githubUrl: 'javascript:alert(1)' },
      }
      await expect(landingRouter.createCaller(c).update(malicious)).rejects.toBeTruthy()
      expect(c.prisma.landingContent.upsert).not.toHaveBeenCalled()
    })
  })

  describe('safeUrl validation', () => {
    it('accepts https, root-relative, anchor, and empty; blocks javascript/data', () => {
      const withHref = (href: string) => ({
        ...DEFAULT_LANDING_CONTENT,
        footer: {
          ...DEFAULT_LANDING_CONTENT.footer,
          whatWeDo: [{ label: 'x', href }],
        },
      })
      for (const ok of ['https://example.com', '/work', '#contact', '']) {
        expect(landingContentSchema.safeParse(withHref(ok)).success).toBe(true)
      }
      for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
        expect(landingContentSchema.safeParse(withHref(bad)).success).toBe(false)
      }
    })
  })
})
