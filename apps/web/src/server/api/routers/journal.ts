import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { canManageOwnedRecord, ownedOrCompany, recordScopeSchema, userCanSeeCompanyRecords } from '../../../lib/record-scope'

async function ownEntry(ctx: any, id: string) {
  const row = await ctx.prisma.journalEntry.findUnique({ where: { id } })
  if (!row || !canManageOwnedRecord(row.userId, ctx.user.id!, ctx.userRole)) throw new TRPCError({ code: 'FORBIDDEN' })
  return row
}

export const journalRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.journalEntry.findMany({
      where: ownedOrCompany(ctx.user.id!, ctx.userRole),
      orderBy: { date: 'desc' },
    }),
  ),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const entry = await ctx.prisma.journalEntry.findUnique({
      where: { id: input.id },
    })
    if (!entry) throw new TRPCError({ code: 'NOT_FOUND' })
    const canView = entry.userId === ctx.user.id || (entry.scope === 'COMPANY' && userCanSeeCompanyRecords(ctx.userRole))
    if (!canView) throw new TRPCError({ code: 'FORBIDDEN' })
    return entry
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().optional(),
        mood: z.string().optional(),
        date: z.coerce.date().optional(),
        scope: recordScopeSchema.default('PERSONAL'),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.journalEntry.create({
        data: { ...input, userId: ctx.user.id! },
      }),
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        mood: z.string().optional(),
        date: z.coerce.date().optional(),
        scope: recordScopeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ownEntry(ctx, input.id)
      const { id, ...data } = input
      return ctx.prisma.journalEntry.update({ where: { id }, data })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ownEntry(ctx, input.id)
    return ctx.prisma.journalEntry.delete({ where: { id: input.id } })
  }),
})
