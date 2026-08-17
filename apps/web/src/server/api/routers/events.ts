import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, requirePermission } from '../trpc'
import { canManageOwnedRecord, ownedOrCompany, recordScopeSchema } from '../../../lib/record-scope'

async function ownEvent(ctx: any, id: string) {
  const row = await ctx.prisma.event.findUnique({ where: { id } })
  if (!row || !canManageOwnedRecord(row.userId, ctx.user.id!, ctx.userRole)) throw new TRPCError({ code: 'FORBIDDEN' })
  return row
}

async function ownSprint(ctx: any, id: string) {
  const row = await ctx.prisma.sprint.findUnique({ where: { id } })
  if (!row || !canManageOwnedRecord(row.userId, ctx.user.id!, ctx.userRole)) throw new TRPCError({ code: 'FORBIDDEN' })
  return row
}

export const eventsRouter = router({
  // ----- Events -----
  list: protectedProcedure.use(requirePermission('events:read')).query(({ ctx }) =>
    ctx.prisma.event.findMany({
      where: ownedOrCompany(ctx.user.id!, ctx.userRole),
      orderBy: { date: 'asc' },
    }),
  ),

  create: protectedProcedure
    .use(requirePermission('events:create'))
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        date: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        startTime: z.string(),
        endTime: z.string(),
        color: z.string().default('#2D6A4F'),
        scope: recordScopeSchema.default('PERSONAL'),
      }),
    )
    .mutation(({ ctx, input }) => ctx.prisma.event.create({ data: { ...input, userId: ctx.user.id! } })),

  update: protectedProcedure
    .use(requirePermission('events:update'))
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        date: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        color: z.string().optional(),
        scope: recordScopeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ownEvent(ctx, input.id)
      const { id, ...data } = input
      return ctx.prisma.event.update({ where: { id }, data })
    }),

  delete: protectedProcedure.use(requirePermission('events:delete')).input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ownEvent(ctx, input.id)
    return ctx.prisma.event.delete({ where: { id: input.id } })
  }),

  // ----- Sprints -----
  listSprints: protectedProcedure.use(requirePermission('events:read')).query(({ ctx }) =>
    ctx.prisma.sprint.findMany({
      where: ownedOrCompany(ctx.user.id!, ctx.userRole),
      orderBy: { startDate: 'desc' },
    }),
  ),

  createSprint: protectedProcedure
    .use(requirePermission('events:create'))
    .input(
      z.object({
        name: z.string().min(1).max(255),
        goal: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        color: z.string().default('#2D6A4F'),
        isActive: z.boolean().default(true),
        scope: recordScopeSchema.default('PERSONAL'),
      }),
    )
    .mutation(({ ctx, input }) => ctx.prisma.sprint.create({ data: { ...input, userId: ctx.user.id! } })),

  updateSprint: protectedProcedure
    .use(requirePermission('events:update'))
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        goal: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
        scope: recordScopeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ownSprint(ctx, input.id)
      const { id, ...data } = input
      return ctx.prisma.sprint.update({ where: { id }, data })
    }),

  deleteSprint: protectedProcedure.use(requirePermission('events:delete')).input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ownSprint(ctx, input.id)
    return ctx.prisma.sprint.delete({ where: { id: input.id } })
  }),
})
