import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, requireRole } from "../trpc";

const internProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.userRole !== "INTERN" && ctx.userRole !== "ADMIN")
    throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
const adminProcedure = internProcedure.use(requireRole(["ADMIN"]));
// Store a calendar date, independently of the browser/server timezone.
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Choose a valid date")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));
const resourceUrl = z.union([
  z.literal(""),
  z
    .string()
    .url()
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "Use an http or https link",
    ),
]);
const activityFields = z.object({
  title: z.string().trim().min(1).max(180),
  kind: z.enum(["STUDY", "EXERCISE"]),
  description: z.string().trim().min(1).max(12000),
  resourceUrl: resourceUrl.default(""),
  assigneeIds: z
    .array(z.string())
    .min(1, "Choose at least one intern")
    .max(500)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Select each intern once",
    ),
});

export const internsRouter = router({
  tasks: internProcedure.query(({ ctx }) =>
    ctx.prisma.task.findMany({
      where: { assigneeId: ctx.user.id! },
      select: {
        id: true,
        assigneeId: true,
        title: true,
        description: true,
        priority: true,
        dueDate: true,
        status: true,
      },
      orderBy: { position: "asc" },
    }),
  ),
  overview: internProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id!;
    const [profile, logs, activities, submissions] = await Promise.all([
      ctx.prisma.internProfile.findUnique({ where: { userId } }),
      ctx.prisma.internLearningLog.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      ctx.prisma.internActivity.findMany({
        where: { archived: false, assignments: { some: { userId } } },
        orderBy: { createdAt: "asc" },
      }),
      ctx.prisma.internSubmission.findMany({
        where: { userId, activity: { assignments: { some: { userId } } } },
        include: { activity: true },
      }),
    ]);
    return { profile, logs, activities, submissions };
  }),

  saveLog: internProcedure
    .input(
      z.object({
        id: z.string().optional(),
        date: calendarDate,
        learned: z.string().trim().min(1, "Write what you learned").max(12000),
        workedOn: z.string().trim().max(12000).default(""),
        blockers: z.string().trim().max(6000).default(""),
        hours: z.number().finite().min(0).max(24),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      try {
        if (id) {
          const result = await ctx.prisma.internLearningLog.updateMany({
            where: { id, userId: ctx.user.id! },
            data: { ...data, feedback: "", reviewedAt: null },
          });
          if (!result.count) throw new TRPCError({ code: "NOT_FOUND" });
          return { success: true };
        }
        await ctx.prisma.internLearningLog.create({
          data: { ...data, userId: ctx.user.id! },
        });
        return { success: true };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An entry already exists for this date. Edit that entry instead.",
          });
        }
        throw error;
      }
    }),

  deleteLog: internProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.internLearningLog.deleteMany({
        where: { id: input.id, userId: ctx.user.id! },
      });
      if (!result.count) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),

  saveProfile: internProcedure
    .input(
      z.object({
        school: z.string().trim().max(180),
        course: z.string().trim().max(180),
        track: z.string().trim().max(180),
        bio: z.string().trim().max(2000),
        startDate: calendarDate.nullable(),
        requiredHours: z.number().int().min(0).max(10000),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.internProfile.upsert({
        where: { userId: ctx.user.id! },
        create: { ...input, userId: ctx.user.id! },
        update: input,
      }),
    ),

  saveSubmission: internProcedure
    .input(
      z.object({
        activityId: z.string(),
        response: z.string().trim().max(20000),
        submit: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.prisma.internActivity.findFirst({
        where: {
          id: input.activityId,
          archived: false,
          assignments: { some: { userId: ctx.user.id! } },
        },
      });
      if (!activity)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This activity is no longer available.",
        });
      if (input.submit && !input.response)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add your notes or solution before submitting.",
        });
      const data = {
        response: input.response,
        status: input.submit ? "SUBMITTED" : "IN_PROGRESS",
        feedback: "",
        reviewedAt: null,
      };
      return ctx.prisma.internSubmission.upsert({
        where: {
          userId_activityId: {
            userId: ctx.user.id!,
            activityId: input.activityId,
          },
        },
        create: { ...data, userId: ctx.user.id!, activityId: input.activityId },
        update: data,
      });
    }),

  roster: adminProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { role: "INTERN" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        internProfile: true,
        _count: {
          select: {
            tasks: true,
            internLearningLogs: true,
            internAssignments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ),

  internRecord: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { id: input.userId, role: "INTERN" },
        select: { id: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const [logs, submissions, tasks] = await Promise.all([
        ctx.prisma.internLearningLog.findMany({
          where: { userId: user.id },
          orderBy: { date: "desc" },
        }),
        ctx.prisma.internSubmission.findMany({
          where: { userId: user.id },
          include: { activity: true },
          orderBy: { updatedAt: "desc" },
        }),
        ctx.prisma.task.findMany({
          where: { assigneeId: user.id },
          orderBy: { dueDate: "asc" },
        }),
      ]);
      return { logs, submissions, tasks };
    }),

  createActivity: adminProcedure
    .input(activityFields)
    .mutation(async ({ ctx, input }) => {
      const { assigneeIds, ...data } = input;
      const count = await ctx.prisma.user.count({
        where: { id: { in: assigneeIds }, role: "INTERN", status: "ACTIVE" },
      });
      if (count !== assigneeIds.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose active intern accounts only.",
        });
      return ctx.prisma.internActivity.create({
        data: {
          ...data,
          creatorId: ctx.user.id!,
          assignments: { create: assigneeIds.map((userId) => ({ userId })) },
        },
      });
    }),

  updateActivity: adminProcedure
    .input(activityFields.extend({ id: z.string(), archived: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { id, assigneeIds, ...data } = input;
      const count = await ctx.prisma.user.count({
        where: { id: { in: assigneeIds }, role: "INTERN" },
      });
      if (count !== assigneeIds.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose intern accounts only.",
        });
      return ctx.prisma.internActivity.update({
        where: { id },
        data: {
          ...data,
          assignments: {
            deleteMany: {},
            create: assigneeIds.map((userId) => ({ userId })),
          },
        },
      });
    }),

  reviewQueue: adminProcedure.query(async ({ ctx }) => {
    const [logs, submissions, activities] = await Promise.all([
      ctx.prisma.internLearningLog.findMany({
        where: { reviewedAt: null },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { date: "asc" },
      }),
      ctx.prisma.internSubmission.findMany({
        where: { status: "SUBMITTED" },
        include: {
          activity: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { updatedAt: "asc" },
      }),
      ctx.prisma.internActivity.findMany({
        include: { assignments: { select: { userId: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { logs, submissions, activities };
  }),

  review: adminProcedure
    .input(
      z.object({
        id: z.string(),
        kind: z.enum(["LOG", "SUBMISSION"]),
        feedback: z.string().trim().min(1).max(6000),
        status: z.enum(["COMPLETED", "CHANGES_REQUESTED"]).default("COMPLETED"),
        // Avoid reviewing a version that changed while the administrator was reading.
        updatedAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = { feedback: input.feedback, reviewedAt: new Date() };
      const result =
        input.kind === "LOG"
          ? await ctx.prisma.internLearningLog.updateMany({
              where: {
                id: input.id,
                updatedAt: input.updatedAt,
                reviewedAt: null,
              },
              data,
            })
          : await ctx.prisma.internSubmission.updateMany({
              where: {
                id: input.id,
                updatedAt: input.updatedAt,
                status: "SUBMITTED",
              },
              data: { ...data, status: input.status },
            });
      if (!result.count)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This record changed. Refresh the review queue and read the latest version.",
        });
      return { success: true };
    }),
});
