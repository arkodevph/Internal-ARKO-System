import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  documentContentSchema,
  parseDocumentContent,
  validateDocumentForPublish,
} from "../../../lib/documents/schema";
import { generateDocumentTemplate } from "../../../lib/documents/templates";
import {
  protectedProcedure,
  publicProcedure,
  requirePermission,
  router,
} from "../trpc";

const DOCUMENT_TYPE = ["INVOICE", "AGREEMENT", "PROPOSAL", "TIMELINE"] as const;
const DOCUMENT_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

function generateInvoiceNumber(sequence: number): string {
  return `INV-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
}

function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

const lineItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const documentsRouter = router({
  list: protectedProcedure
    .use(requirePermission("documents:read"))
    .input(
      z
        .object({
          status: z.enum(DOCUMENT_STATUS).optional(),
          type: z.enum(DOCUMENT_TYPE).optional(),
          projectId: z.string().optional(),
          search: z.string().trim().optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.document.findMany({
        where: {
          createdById: ctx.user.id!,
          ...(input.status ? { status: input.status } : {}),
          ...(input.type ? { type: input.type } : {}),
          ...(input.projectId ? { projectId: input.projectId } : {}),
          ...(input.search
            ? {
                OR: [
                  {
                    title: {
                      contains: input.search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    invoiceNumber: {
                      contains: input.search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              client: { select: { name: true, email: true } },
            },
          },
          client: { select: { id: true, name: true, email: true } },
          lineItems: { orderBy: { sortOrder: "asc" } },
        },
      });
    }),

  get: protectedProcedure
    .use(requirePermission("documents:read"))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: {
          project: { select: { id: true, name: true, summary: true } },
          client: { select: { id: true, name: true, email: true } },
          lineItems: { orderBy: { sortOrder: "asc" } },
        },
      });

      if (!doc)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      if (doc.createdById !== ctx.user.id && ctx.userRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access this document",
        });
      }

      return doc;
    }),

  create: protectedProcedure
    .use(requirePermission("documents:create"))
    .input(
      z.object({
        projectId: z.string(),
        type: z.enum(DOCUMENT_TYPE),
        title: z.string().trim().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.clientProject.findFirst({
        where: {
          id: input.projectId,
          ...(ctx.userRole === "ADMIN" ? {} : { ownerId: ctx.user.id! }),
        },
        include: {
          client: true,
          milestones: { orderBy: { dueDate: "asc" } },
          deliverables: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!project)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client project not found",
        });

      const generated = generateDocumentTemplate({
        type: input.type,
        project,
        client: project.client,
      });
      return ctx.prisma.document.create({
        data: {
          type: input.type,
          title: input.title || generated.title,
          status: "DRAFT",
          projectId: project.id,
          clientId: project.clientId,
          content: generated.content as Prisma.InputJsonValue,
          issueDate: new Date(),
          dueDate: generated.dueDate,
          shareToken: generateToken(),
          createdById: ctx.user.id!,
          lineItems: { create: generated.lineItems },
        },
        include: { lineItems: true, project: true },
      });
    }),

  update: protectedProcedure
    .use(requirePermission("documents:update"))
    .input(
      z.object({
        id: z.string(),
        title: z.string().trim().min(1).optional(),
        status: z.enum(DOCUMENT_STATUS).optional(),
        issueDate: z.date().nullable().optional(),
        dueDate: z.date().nullable().optional(),
        invoiceNumber: z.string().trim().min(1).max(100).nullable().optional(),
        content: documentContentSchema.optional(),
        lineItems: z.array(lineItemSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: { lineItems: { orderBy: { sortOrder: "asc" } } },
      });

      if (!existing)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      if (existing.createdById !== ctx.user.id && ctx.userRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this document",
        });
      }
      if (existing.status === "ARCHIVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Archived documents cannot be modified",
        });
      }

      const nextTitle = input.title ?? existing.title;
      const nextContent =
        input.content ?? parseDocumentContent(existing.content);
      const nextLineItems = input.lineItems ?? existing.lineItems;
      const nextIssueDate =
        input.issueDate === undefined ? existing.issueDate : input.issueDate;
      const nextDueDate =
        input.dueDate === undefined ? existing.dueDate : input.dueDate;

      if ((input.status ?? existing.status) === "PUBLISHED") {
        const errors = validateDocumentForPublish({
          type: existing.type,
          title: nextTitle,
          content: nextContent,
          lineItems: nextLineItems,
          issueDate: nextIssueDate,
          dueDate: nextDueDate,
        });
        if (errors.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errors.join(" "),
          });
        }
      }

      let invoiceNumber =
        input.invoiceNumber === undefined
          ? existing.invoiceNumber
          : input.invoiceNumber;
      if (invoiceNumber && invoiceNumber !== existing.invoiceNumber) {
        const duplicate = await ctx.prisma.document.findUnique({
          where: { invoiceNumber },
          select: { id: true },
        });
        if (duplicate && duplicate.id !== existing.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This billing statement number is already in use.",
          });
        }
      }
      let publishedAt = existing.publishedAt;
      if (input.status === "PUBLISHED") {
        publishedAt ??= new Date();
        if (existing.type === "INVOICE" && !invoiceNumber) {
          const totalInvoices = await ctx.prisma.document.count({
            where: { type: "INVOICE", invoiceNumber: { not: null } },
          });
          invoiceNumber = generateInvoiceNumber(totalInvoices + 1);
        }
      }

      return ctx.prisma.document.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.issueDate !== undefined
            ? { issueDate: input.issueDate }
            : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.content !== undefined
            ? { content: input.content as Prisma.InputJsonValue }
            : {}),
          ...(invoiceNumber !== existing.invoiceNumber
            ? { invoiceNumber }
            : {}),
          ...(publishedAt !== existing.publishedAt ? { publishedAt } : {}),
          ...(input.lineItems
            ? {
                lineItems: {
                  deleteMany: {},
                  create: input.lineItems.map((item, index) => ({
                    ...item,
                    sortOrder: item.sortOrder ?? index,
                  })),
                },
              }
            : {}),
        },
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, email: true } },
          lineItems: { orderBy: { sortOrder: "asc" } },
        },
      });
    }),

  delete: protectedProcedure
    .use(requirePermission("documents:delete"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({
        where: { id: input.id },
      });
      if (!doc)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      if (doc.createdById !== ctx.user.id && ctx.userRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this document",
        });
      }
      if (doc.status !== "DRAFT" && ctx.userRole !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft documents can be deleted",
        });
      }
      await ctx.prisma.document.delete({ where: { id: input.id } });
      return { success: true };
    }),

  generateShareToken: protectedProcedure
    .use(requirePermission("documents:update"))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({
        where: { id: input.id },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      if (doc.createdById !== ctx.user.id && ctx.userRole !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: { shareToken: generateToken() },
      });
      return { shareToken: updated.shareToken };
    }),

  publicGet: publicProcedure
    .input(z.object({ token: z.string().min(20) }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { shareToken: input.token, status: "PUBLISHED" },
        select: {
          id: true,
          type: true,
          title: true,
          status: true,
          invoiceNumber: true,
          content: true,
          issueDate: true,
          dueDate: true,
          publishedAt: true,
          updatedAt: true,
          project: { select: { name: true } },
          client: { select: { name: true, email: true } },
          lineItems: { orderBy: { sortOrder: "asc" } },
        },
      });

      if (!doc)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      return doc;
    }),
});
