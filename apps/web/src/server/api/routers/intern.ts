import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { router, protectedProcedure, requireRole } from "../trpc";
import { s3, S3_BUCKET } from "../../../lib/s3";
import { DOCUMENT_MIME_TYPES, INTERN_DOCUMENT_TYPE } from "../../../lib/intern-documents";

const internProcedure = protectedProcedure.use(
  requireRole(["INTERN", "ADMIN"]),
);
const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  project: { select: { name: true } },
  reviews: {
    select: {
      id: true,
      prLink: true,
      createdAt: true,
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;
const eventSelect = {
  id: true,
  title: true,
  description: true,
  date: true,
  endDate: true,
  startTime: true,
  endTime: true,
} as const;
const pagination = {
  page: z.number().int().min(1).default(1),
  search: z.string().trim().max(200).default(""),
};

export const internRouter = router({
  documents: internProcedure
    .input(z.object({
      ...pagination,
      kind: z.enum(["pdf", "docx"]).optional(),
    }).default({}))
    .query(async ({ ctx, input }) => {
      const where = {
        userId: ctx.user.id!, resourceType: INTERN_DOCUMENT_TYPE,
        scope: "PERSONAL" as const,
        ...(input.kind ? { mimeType: DOCUMENT_MIME_TYPES[input.kind] } : {}),
        ...(input.search ? { fileName: { contains: input.search, mode: "insensitive" as const } } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.fileAttachment.findMany({
          where, select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (input.page - 1) * 20,
        }),
        ctx.prisma.fileAttachment.count({ where }),
      ]);
      return { items, total, pages: Math.max(1, Math.ceil(total / 20)) };
    }),
  overview: internProcedure.query(async ({ ctx }) => {
    const where = { assigneeId: ctx.user.id! };
    const [counts, tasks, resources, events] = await Promise.all([
      ctx.prisma.task.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      ctx.prisma.task.findMany({
        where: { ...where, status: { not: "DONE" } },
        select: taskSelect,
        orderBy: [{ dueDate: "asc" }, { id: "asc" }],
        take: 5,
      }),
      ctx.prisma.resource.findMany({
        where: { internShared: true },
        select: {
          id: true,
          title: true,
          description: true,
          resourceType: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      ctx.prisma.event.findMany({
        where: {
          internShared: true,
          OR: [
            { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
            { endDate: { gte: new Date() } },
          ],
        },
        select: eventSelect,
        orderBy: { date: "asc" },
        take: 3,
      }),
    ]);
    return {
      counts: Object.fromEntries(
        counts.map((row) => [row.status, row._count._all]),
      ),
      tasks,
      resources,
      events,
    };
  }),

  tasks: internProcedure
    .input(
      z
        .object({
          ...pagination,
          focusId: z.string().optional(),
          status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        assigneeId: ctx.user.id!,
        ...(input.focusId ? { id: input.focusId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.search
          ? { title: { contains: input.search, mode: "insensitive" as const } }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.task.findMany({
          where,
          select: taskSelect,
          orderBy: [{ dueDate: "asc" }, { id: "asc" }],
          take: 20,
          skip: (input.page - 1) * 20,
        }),
        ctx.prisma.task.count({ where }),
      ]);
      return { items, total, pages: Math.max(1, Math.ceil(total / 20)) };
    }),

  taskComments: internProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findFirst({
        where: { id: input.taskId, assigneeId: ctx.user.id! },
        select: { id: true },
      });
      if (!task)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assigned task not found.",
        });
      return ctx.prisma.comment.findMany({
        where: { resourceType: "TASK", resourceId: input.taskId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 200,
      });
    }),

  updateTask: internProcedure
    .input(
      z
        .object({
          id: z.string(),
          status: z.enum(["TODO", "IN_PROGRESS", "REVIEW"]).optional(),
          comment: z.string().trim().min(1).max(2000).optional(),
        })
        .refine(
          (value) => value.status || value.comment,
          "Add an update or choose a status.",
        ),
    )
    .mutation(async ({ ctx, input }) => {
      // Check assignment again inside the write. Completed work is reopened by a
      // mentor; interns submit REVIEW and the existing staff review gate owns DONE.
      return ctx.prisma.$transaction(async (tx) => {
        const result = await tx.task.updateMany({
          where: {
            id: input.id,
            assigneeId: ctx.user.id!,
            status: { not: "DONE" },
          },
          data: {
            ...(input.status ? { status: input.status } : {}),
            updatedAt: new Date(),
          },
        });
        if (result.count !== 1)
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This task is complete or is no longer assigned to you. Refresh your tasks.",
          });
        if (input.comment)
          await tx.comment.create({
            data: {
              resourceType: "TASK",
              resourceId: input.id,
              content: input.comment,
              userId: ctx.user.id!,
            },
          });
        return { success: true };
      });
    }),

  resources: internProcedure
    .input(
      z
        .object({ ...pagination, categoryId: z.string().optional() })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        internShared: true,
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.search
          ? {
              OR: [
                {
                  title: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      };
      const [items, total, categories] = await Promise.all([
        ctx.prisma.resource.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            resourceType: true,
            tags: true,
            category: { select: { id: true, name: true } },
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: 20,
          skip: (input.page - 1) * 20,
        }),
        ctx.prisma.resource.count({ where }),
        ctx.prisma.resourceCategory.findMany({
          where: { resources: { some: { internShared: true } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);
      return {
        items,
        total,
        categories,
        pages: Math.max(1, Math.ceil(total / 20)),
      };
    }),

  attachments: internProcedure
    .input(z.object({ resourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const resource = await ctx.prisma.resource.findFirst({
        where: { id: input.resourceId, internShared: true },
        select: { id: true },
      });
      if (!resource)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shared resource not found.",
        });
      return ctx.prisma.fileAttachment.findMany({
        where: {
          resourceType: "RESOURCE",
          resourceId: input.resourceId,
          scope: "COMPANY",
        },
        select: { id: true, fileName: true, fileSize: true },
        orderBy: { createdAt: "asc" },
      });
    }),

  download: internProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const file = await ctx.prisma.fileAttachment.findFirst({
        where: {
          id: input.id,
          resourceType: "RESOURCE",
          scope: "COMPANY",
          resourceId: { not: null },
        },
      });
      if (!file?.resourceId) throw new TRPCError({ code: "NOT_FOUND" });
      const resource = await ctx.prisma.resource.findFirst({
        where: { id: file.resourceId, internShared: true },
        select: { id: true },
      });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.fileKey }),
          { expiresIn: 300 },
        ),
      };
    }),

  calendar: internProcedure
    .input(
      z
        .object({ start: z.date(), end: z.date() })
        .refine(
          (value) =>
            value.end > value.start &&
            value.end.getTime() - value.start.getTime() <= 93 * 86400000,
          "Choose a range of up to three months.",
        ),
    )
    .query(async ({ ctx, input }) => {
      const [events, deadlines] = await Promise.all([
        ctx.prisma.event.findMany({
          where: {
            internShared: true,
            date: { lt: input.end },
            OR: [
              { endDate: { gte: input.start } },
              { date: { gte: input.start } },
            ],
          },
          select: eventSelect,
          orderBy: { date: "asc" },
        }),
        ctx.prisma.task.findMany({
          where: {
            assigneeId: ctx.user.id!,
            dueDate: { gte: input.start, lt: input.end },
          },
          select: { id: true, title: true, dueDate: true, status: true },
          orderBy: { dueDate: "asc" },
        }),
      ]);
      return { events, deadlines };
    }),
});
