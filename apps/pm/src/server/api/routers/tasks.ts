import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
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

export const tasksRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.task.findMany({
      where: { scope: "PERSONAL" },
      include: taskInclude,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
  ),

  // PRD: a task cannot exist without a deadline — zod makes dueDate required.
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        dueDate: z.date({ required_error: "Deadline is required" }),
        assigneeId: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.task.create({
        data: {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          assigneeId: input.assigneeId ?? ctx.user.id,
          scope: "PERSONAL",
          status: "TODO",
        },
        include: taskInclude,
      }),
    ),

  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
        position: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

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
  recordReview: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        prLink: z.string().url("Must be a valid PR link"),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.reviewRecord.create({
        data: {
          taskId: input.taskId,
          reviewerId: ctx.user.id,
          prLink: input.prLink,
        },
      }),
    ),
});
