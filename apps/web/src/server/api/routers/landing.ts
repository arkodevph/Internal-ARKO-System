import { Prisma } from '@prisma/client'
import { revalidatePath, revalidateTag } from 'next/cache'
import {
  router,
  publicProcedure,
  protectedProcedure,
  requireRole,
} from '../trpc'
import {
  landingContentSchema,
  mergeLandingContent,
} from '../../../lib/landing/content'
import { LANDING_CACHE_TAG } from '../../../lib/landing/get-content'

export const landingRouter = router({
  // Public: the marketing page and the admin form both read the current content.
  get: publicProcedure.query(async ({ ctx }) => {
    const row = await ctx.prisma.landingContent.findFirst({
      where: { singleton: true },
    })
    return mergeLandingContent(row?.content)
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const row = await ctx.prisma.landingContent.findFirst({
      where: { singleton: true },
      select: { viewCount: true, lastViewedAt: true },
    })
    return {
      viewCount: row?.viewCount ?? 0,
      lastViewedAt: row?.lastViewedAt ?? null,
    }
  }),

  // Admin-only: replace the full landing content, then revalidate the public page.
  update: protectedProcedure
    .use(requireRole(['ADMIN']))
    .input(landingContentSchema)
    .mutation(async ({ ctx, input }) => {
      const saved = await ctx.prisma.landingContent.upsert({
        where: { singleton: true },
        create: {
          singleton: true,
          content: input as unknown as Prisma.InputJsonValue,
          updatedById: ctx.user.id,
        },
        update: {
          content: input as unknown as Prisma.InputJsonValue,
          updatedById: ctx.user.id,
        },
      })
      revalidateTag(LANDING_CACHE_TAG)
      revalidatePath('/')
      return mergeLandingContent(saved.content)
    }),
})
