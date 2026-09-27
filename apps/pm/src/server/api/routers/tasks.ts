import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, requireRole } from "../../../../../web/src/server/api/trpc";
import type { TRPCContext } from "../../../../../web/src/lib/trpc/context";
import {
  REVIEW_GATE_MESSAGE,
  assertCanMarkDone,
} from "../../services/review-gate";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  reviews: {
    select: {
      id: true,
      prLink: true,
      createdAt: true,
      reviewer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

const pmProcedure = protectedProcedure.use(requireRole(["ADMIN", "MEMBER", "USER", "ACCOUNTANT"]));

async function assertTaskAccess(
  ctx: Pick<TRPCContext, 'prisma' | 'userRole'> & { user: NonNullable<TRPCContext['user']> },
  taskId: string,
) {
  const task = await ctx.prisma.task.findFirst({
    where: {
      id: taskId,
      scope: 'PERSONAL',
      ...(ctx.userRole === 'ADMIN' ? {} : { assigneeId: ctx.user.id }),
    },
    select: { id: true, status: true },
  })
  if (!task) throw new TRPCError({ code: 'NOT_FOUND' })
  return task
}

export const tasksRouter = router({
  list: pmProcedure.query(({ ctx }) =>
    ctx.prisma.task.findMany({
      where: { scope: "PERSONAL", ...(ctx.userRole === 'ADMIN' ? {} : { assigneeId: ctx.user.id }) },
      include: taskInclude,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
  ),

  // PRD: a task cannot exist without a deadline — zod makes dueDate required.
  create: pmProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        dueDate: z.date({ required_error: "Deadline is required" }),
        assigneeId: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (ctx.userRole !== 'ADMIN' && input.assigneeId && input.assigneeId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      return ctx.prisma.task.create({
        data: {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          assigneeId: input.assigneeId ?? ctx.user.id,
          scope: "PERSONAL",
          status: "TODO",
        },
        include: taskInclude,
      })
    }),

  move: pmProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await assertTaskAccess(ctx, input.id);

      // Review gate: DONE requires at least one recorded review.
      if (input.status === "DONE" && task.status !== "DONE") {
        const reviewCount = await ctx.prisma.reviewRecord.count({
          where: { taskId: input.id },
        });
        try {
          assertCanMarkDone(reviewCount);
        } catch (err) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: err instanceof Error ? err.message : REVIEW_GATE_MESSAGE,
          });
        }
      }

      return ctx.prisma.task.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.position !== undefined && { position: input.position }),
        },
        include: taskInclude,
      });
    }),

  // Records the human review: reviewer = the person recording it, link = PR.
  recordReview: pmProcedure
    .input(
      z.object({
        taskId: z.string(),
        prLink: z.string().url("Must be a valid PR link"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertTaskAccess(ctx, input.taskId)
      return ctx.prisma.reviewRecord.create({
        data: {
          taskId: input.taskId,
          reviewerId: ctx.user.id,
          prLink: input.prLink,
        },
      })
    }),
});
