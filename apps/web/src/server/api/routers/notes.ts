import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { canManageOwnedRecord, ownedOrCompany, recordScopeSchema, userCanSeeCompanyRecords } from '../../../lib/record-scope'

export const notesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id!
    return ctx.prisma.note.findMany({
      where: ownedOrCompany(userId, ctx.userRole),
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        scope: true,
      },
    })
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const userId = ctx.user.id!

    const note = await ctx.prisma.note.findUnique({
      where: { id: input.id },
    })
    if (!note) throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
    const canView = note.userId === userId || (note.scope === 'COMPANY' && userCanSeeCompanyRecords(ctx.userRole))
    if (!canView) throw new TRPCError({ code: 'FORBIDDEN', message: 'Note is personal' })

    return note
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        content: z.string().default(''),
        scope: recordScopeSchema.default('PERSONAL'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id!
      return ctx.prisma.note.create({
        data: {
          title: input.title,
          content: input.content,
          userId,
        },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().optional(),
        scope: recordScopeSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id!

      const note = await ctx.prisma.note.findUnique({
        where: { id: input.id },
      })
      if (!note) throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      if (!canManageOwnedRecord(note.userId, userId, ctx.userRole))
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the owner can update this note',
        })

      return ctx.prisma.note.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.content !== undefined && { content: input.content }),
          ...(input.scope !== undefined && { scope: input.scope }),
        },
      })
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id!

    const note = await ctx.prisma.note.findUnique({
      where: { id: input.id },
    })
    if (!note) throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
    if (!canManageOwnedRecord(note.userId, userId, ctx.userRole))
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the owner can delete this note',
      })

    return ctx.prisma.note.delete({ where: { id: input.id } })
  }),
})
