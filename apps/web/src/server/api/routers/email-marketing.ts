import { Prisma } from "@arko/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, requireRole, router } from "../trpc";
import {
  DEFAULT_EMAIL_MARKETING_SETTINGS,
  enrollContactForTrigger,
  normalizeMarketingEmail,
  processCampaignBatch,
  queueCampaign,
  resolveCampaignAudience,
  retryFailedCampaignRecipients,
  sendMarketingTestEmail,
} from "../../services/email-marketing";

const marketingProcedure = protectedProcedure.use(
  requireRole(["ADMIN", "MEMBER"]),
);
const marketingAdminProcedure = protectedProcedure.use(requireRole(["ADMIN"]));

const optionalText = z.string().trim().max(2_000).optional().nullable();
const email = z.string().trim().email().transform(normalizeMarketingEmail);
const contactStatus = z.enum([
  "SUBSCRIBED",
  "UNSUBSCRIBED",
  "BOUNCED",
  "COMPLAINED",
  "INVALID",
  "ARCHIVED",
]);

const contactFields = z.object({
  email,
  firstName: z.string().trim().max(120).optional().nullable(),
  lastName: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
  street: z.string().trim().max(255).optional().nullable(),
  address2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  region: z.string().trim().max(120).optional().nullable(),
  postal: z.string().trim().max(40).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  status: contactStatus.default("SUBSCRIBED"),
  consentSource: z.string().trim().max(200).optional().nullable(),
  consentAt: z.coerce.date().optional().nullable(),
  sourceId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).max(100).default([]),
  segmentIds: z.array(z.string()).max(100).default([]),
});

const contactRecordFields = contactFields.omit({
  tagIds: true,
  segmentIds: true,
});

function contactData(
  input: z.infer<typeof contactRecordFields> & {
    tagIds?: string[];
    segmentIds?: string[];
  },
) {
  const { tagIds: _tagIds, segmentIds: _segmentIds, ...data } = input;
  return data;
}

const audienceRules = z.object({
  includeContactIds: z.array(z.string()).max(10_000).default([]),
  excludeContactIds: z.array(z.string()).max(10_000).default([]),
  includeTagIds: z.array(z.string()).max(500).default([]),
  excludeTagIds: z.array(z.string()).max(500).default([]),
  includeSegmentIds: z.array(z.string()).max(500).default([]),
  excludeSegmentIds: z.array(z.string()).max(500).default([]),
});

const campaignFields = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalText,
  templateId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  fromName: z.string().trim().min(1).max(120),
  fromEmail: email,
  replyTo: z
    .union([email, z.literal("")])
    .optional()
    .nullable()
    .transform((value) => value || null),
  subject: z.string().trim().min(1).max(500),
  previewText: z.string().trim().max(500).optional().nullable(),
  htmlBody: z.string().min(1).max(500_000),
  textBody: z.string().max(500_000).optional().nullable(),
  timezone: z.string().trim().min(1).max(80).default("Asia/Manila"),
  audience: audienceRules,
});

async function replaceCampaignRules(
  tx: Prisma.TransactionClient,
  campaignId: string,
  rules: z.infer<typeof audienceRules>,
) {
  await Promise.all([
    tx.emailCampaignContact.deleteMany({ where: { campaignId } }),
    tx.emailCampaignTag.deleteMany({ where: { campaignId } }),
    tx.emailCampaignSegment.deleteMany({ where: { campaignId } }),
  ]);
  await Promise.all([
    rules.includeContactIds.length
      ? tx.emailCampaignContact.createMany({
          data: rules.includeContactIds.map((contactId) => ({
            campaignId,
            contactId,
            ruleType: "INCLUDE",
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    rules.excludeContactIds.length
      ? tx.emailCampaignContact.createMany({
          data: rules.excludeContactIds.map((contactId) => ({
            campaignId,
            contactId,
            ruleType: "EXCLUDE",
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    rules.includeTagIds.length
      ? tx.emailCampaignTag.createMany({
          data: rules.includeTagIds.map((tagId) => ({
            campaignId,
            tagId,
            ruleType: "INCLUDE",
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    rules.excludeTagIds.length
      ? tx.emailCampaignTag.createMany({
          data: rules.excludeTagIds.map((tagId) => ({
            campaignId,
            tagId,
            ruleType: "EXCLUDE",
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    rules.includeSegmentIds.length
      ? tx.emailCampaignSegment.createMany({
          data: rules.includeSegmentIds.map((segmentId) => ({
            campaignId,
            segmentId,
            ruleType: "INCLUDE",
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    rules.excludeSegmentIds.length
      ? tx.emailCampaignSegment.createMany({
          data: rules.excludeSegmentIds.map((segmentId) => ({
            campaignId,
            segmentId,
            ruleType: "EXCLUDE",
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
  ]);
}

const contactsRouter = router({
  list: marketingProcedure
    .input(
      z
        .object({
          search: z.string().trim().max(200).default(""),
          status: contactStatus.optional(),
          tagId: z.string().optional(),
          segmentId: z.string().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(100).default(25),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.MarketingContactWhereInput = {
        ...(input.status && { status: input.status }),
        ...(input.tagId && { tags: { some: { tagId: input.tagId } } }),
        ...(input.segmentId && {
          segments: { some: { segmentId: input.segmentId } },
        }),
        ...(input.search && {
          OR: [
            { email: { contains: input.search, mode: "insensitive" } },
            { firstName: { contains: input.search, mode: "insensitive" } },
            { lastName: { contains: input.search, mode: "insensitive" } },
            { company: { contains: input.search, mode: "insensitive" } },
          ],
        }),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.marketingContact.findMany({
          where,
          include: {
            source: true,
            tags: { include: { tag: true } },
            segments: { include: { segment: true } },
            _count: { select: { recipients: true, inboxMessages: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.marketingContact.count({ where }),
      ]);
      return { items, total, page: input.page, pageSize: input.pageSize };
    }),

  create: marketingProcedure
    .input(contactFields)
    .mutation(async ({ ctx, input }) => {
      try {
        const created = await ctx.prisma.$transaction(async (tx) => {
          const contact = await tx.marketingContact.create({
            data: { ...contactData(input), createdById: ctx.user.id! },
          });
          if (input.tagIds.length) {
            await tx.marketingContactTag.createMany({
              data: input.tagIds.map((tagId) => ({
                contactId: contact.id,
                tagId,
              })),
              skipDuplicates: true,
            });
          }
          if (input.segmentIds.length) {
            await tx.marketingSegmentMember.createMany({
              data: input.segmentIds.map((segmentId) => ({
                contactId: contact.id,
                segmentId,
              })),
              skipDuplicates: true,
            });
          }
          return contact;
        });
        await enrollContactForTrigger(
          ctx.prisma,
          created.id,
          "CONTACT_ADDED",
          created.id,
        );
        if (created.status === "SUBSCRIBED") {
          await enrollContactForTrigger(
            ctx.prisma,
            created.id,
            "SUBSCRIPTION_CONFIRMED",
            created.id,
          );
        }
        for (const tagId of input.tagIds)
          await enrollContactForTrigger(
            ctx.prisma,
            created.id,
            "TAG_ADDED",
            tagId,
          );
        return created;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A marketing contact with this email already exists",
          });
        }
        throw error;
      }
    }),

  update: marketingProcedure
    .input(contactFields.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, tagIds, segmentIds, ...fields } = input;
      const existing = await ctx.prisma.marketingContact.findUnique({
        where: { id },
        include: { tags: { select: { tagId: true } } },
      });
      if (!existing)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact not found",
        });
      const updated = await ctx.prisma.$transaction(async (tx) => {
        const contact = await tx.marketingContact.update({
          where: { id },
          data: fields,
        });
        if (tagIds) {
          await tx.marketingContactTag.deleteMany({ where: { contactId: id } });
          if (tagIds.length)
            await tx.marketingContactTag.createMany({
              data: tagIds.map((tagId) => ({ contactId: id, tagId })),
            });
        }
        if (segmentIds) {
          await tx.marketingSegmentMember.deleteMany({
            where: { contactId: id },
          });
          if (segmentIds.length)
            await tx.marketingSegmentMember.createMany({
              data: segmentIds.map((segmentId) => ({
                contactId: id,
                segmentId,
              })),
            });
        }
        if (contact.status === "UNSUBSCRIBED") {
          await tx.emailSuppression.upsert({
            where: { email: contact.email },
            create: {
              email: contact.email,
              reason: "UNSUBSCRIBED",
              source: "ARKO_USER",
            },
            update: {
              reason: "UNSUBSCRIBED",
              source: "ARKO_USER",
              suppressedAt: new Date(),
            },
          });
        } else if (contact.status === "SUBSCRIBED") {
          await tx.emailSuppression.deleteMany({
            where: { email: contact.email, reason: "UNSUBSCRIBED" },
          });
        }
        return contact;
      });
      if (existing.status !== "SUBSCRIBED" && updated.status === "SUBSCRIBED") {
        await enrollContactForTrigger(
          ctx.prisma,
          id,
          "SUBSCRIPTION_CONFIRMED",
          `${id}:${Date.now()}`,
        );
      }
      if (tagIds) {
        const previous = new Set(existing.tags.map((row) => row.tagId));
        for (const tagId of tagIds.filter((value) => !previous.has(value))) {
          await enrollContactForTrigger(ctx.prisma, id, "TAG_ADDED", tagId);
        }
      }
      return updated;
    }),

  archive: marketingAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.marketingContact.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      }),
    ),

  import: marketingProcedure
    .input(
      z.object({
        rows: z.array(contactRecordFields).min(1).max(2_000),
        onConflict: z.enum(["SKIP", "UPDATE", "MERGE"]).default("SKIP"),
        tagIds: z.array(z.string()).max(100).default([]),
        segmentIds: z.array(z.string()).max(100).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = { created: 0, updated: 0, skipped: 0, failed: 0 };
      for (const row of input.rows) {
        try {
          const existing = await ctx.prisma.marketingContact.findUnique({
            where: { email: row.email },
          });
          if (existing && input.onConflict === "SKIP") {
            result.skipped += 1;
            continue;
          }
          const contact = existing
            ? await ctx.prisma.marketingContact.update({
                where: { id: existing.id },
                data:
                  input.onConflict === "MERGE"
                    ? Object.fromEntries(
                        Object.entries(contactData(row)).filter(
                          ([, value]) =>
                            value !== null &&
                            value !== undefined &&
                            value !== "",
                        ),
                      )
                    : contactData(row),
              })
            : await ctx.prisma.marketingContact.create({
                data: { ...contactData(row), createdById: ctx.user.id! },
              });
          if (input.tagIds.length)
            await ctx.prisma.marketingContactTag.createMany({
              data: input.tagIds.map((tagId) => ({
                contactId: contact.id,
                tagId,
              })),
              skipDuplicates: true,
            });
          if (input.segmentIds.length)
            await ctx.prisma.marketingSegmentMember.createMany({
              data: input.segmentIds.map((segmentId) => ({
                contactId: contact.id,
                segmentId,
              })),
              skipDuplicates: true,
            });
          if (!existing)
            await enrollContactForTrigger(
              ctx.prisma,
              contact.id,
              "CONTACT_ADDED",
              contact.id,
            );
          existing ? (result.updated += 1) : (result.created += 1);
        } catch {
          result.failed += 1;
        }
      }
      return result;
    }),

  export: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.marketingContact.findMany({
      include: {
        tags: { include: { tag: true } },
        segments: { include: { segment: true } },
        source: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ),
});

const tagsRouter = router({
  list: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.marketingTag.findMany({
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: "asc" },
    }),
  ),
  create: marketingProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(100),
        color: z
          .string()
          .regex(/^#[0-9a-f]{6}$/i)
          .default("#6366f1"),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.marketingTag.create({ data: input }),
    ),
  delete: marketingAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.marketingTag.delete({ where: { id: input.id } }),
    ),
});

const segmentsRouter = router({
  list: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.marketingSegment.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
  ),
  create: marketingProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(120),
        description: optionalText,
        contactIds: z.array(z.string()).max(10_000).default([]),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.marketingSegment.create({
        data: {
          name: input.name,
          description: input.description,
          createdById: ctx.user.id!,
          members: {
            createMany: {
              data: input.contactIds.map((contactId) => ({ contactId })),
              skipDuplicates: true,
            },
          },
        },
      }),
    ),
  updateMembers: marketingProcedure
    .input(
      z.object({ id: z.string(), contactIds: z.array(z.string()).max(10_000) }),
    )
    .mutation(async ({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        await tx.marketingSegmentMember.deleteMany({
          where: { segmentId: input.id },
        });
        if (input.contactIds.length)
          await tx.marketingSegmentMember.createMany({
            data: input.contactIds.map((contactId) => ({
              segmentId: input.id,
              contactId,
            })),
          });
        return tx.marketingSegment.findUnique({
          where: { id: input.id },
          include: { _count: { select: { members: true } } },
        });
      }),
    ),
});

const sourcesRouter = router({
  list: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.marketingSource.findMany({
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: "asc" },
    }),
  ),
  create: marketingProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(120),
        email: z
          .union([email, z.literal("")])
          .optional()
          .transform((value) => value || null),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.marketingSource.create({ data: input }),
    ),
});

const templatesRouter = router({
  list: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.emailTemplate.findMany({
      include: { _count: { select: { campaigns: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ),
  create: marketingProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(160),
        description: optionalText,
        subject: z.string().trim().min(1).max(500),
        previewText: z.string().max(500).optional().nullable(),
        htmlBody: z.string().min(1).max(500_000),
        textBody: z.string().max(500_000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.emailTemplate.create({
        data: { ...input, createdById: ctx.user.id! },
      }),
    ),
  update: marketingProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(160).optional(),
        description: optionalText,
        subject: z.string().trim().min(1).max(500).optional(),
        previewText: z.string().max(500).optional().nullable(),
        htmlBody: z.string().min(1).max(500_000).optional(),
        textBody: z.string().max(500_000).optional().nullable(),
      }),
    )
    .mutation(({ ctx, input: { id, ...data } }) =>
      ctx.prisma.emailTemplate.update({ where: { id }, data }),
    ),
  duplicate: marketingProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findUnique({
        where: { id: input.id },
      });
      if (!template)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...copy
      } = template;
      return ctx.prisma.emailTemplate.create({
        data: {
          ...copy,
          name: `${copy.name} (Copy)`,
          status: "ACTIVE",
          createdById: ctx.user.id!,
        },
      });
    }),
  archive: marketingProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.emailTemplate.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      }),
    ),
  testSend: marketingProcedure
    .input(
      z.object({
        id: z.string(),
        to: email,
        firstName: z.string().trim().max(120).optional(),
        lastName: z.string().trim().max(120).optional(),
        company: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.emailTemplate.findUnique({
        where: { id: input.id },
      });
      if (!template)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      try {
        return await sendMarketingTestEmail(ctx.prisma, {
          to: input.to,
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
          firstName: input.firstName,
          lastName: input.lastName,
          company: input.company,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Unable to send the test email",
        });
      }
    }),
});

const campaignsRouter = router({
  list: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.emailCampaign.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ),
  get: marketingProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.emailCampaign.findUnique({
        where: { id: input.id },
        include: {
          contactRules: true,
          tagRules: true,
          segmentRules: true,
          recipients: { orderBy: { queuedAt: "asc" }, take: 250 },
        },
      }),
    ),
  create: marketingProcedure
    .input(campaignFields)
    .mutation(async ({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const { audience, ...data } = input;
        const campaign = await tx.emailCampaign.create({
          data: { ...data, createdById: ctx.user.id! },
        });
        await replaceCampaignRules(tx, campaign.id, audience);
        return campaign;
      }),
    ),
  update: marketingProcedure
    .input(
      campaignFields
        .partial()
        .extend({ id: z.string(), audience: audienceRules.optional() }),
    )
    .mutation(async ({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.emailCampaign.findUnique({
          where: { id: input.id },
        });
        if (!existing)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        if (existing.status !== "DRAFT")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only draft campaigns can be edited",
          });
        const { id, audience, ...data } = input;
        const campaign = await tx.emailCampaign.update({ where: { id }, data });
        if (audience) await replaceCampaignRules(tx, id, audience);
        return campaign;
      }),
    ),
  audiencePreview: marketingProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => resolveCampaignAudience(ctx.prisma, input.id)),
  duplicate: marketingProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.prisma.emailCampaign.findUnique({
        where: { id: input.id },
        include: { contactRules: true, tagRules: true, segmentRules: true },
      });
      if (!source)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      return ctx.prisma.$transaction(async (tx) => {
        const campaign = await tx.emailCampaign.create({
          data: {
            name: `${source.name} (Copy)`,
            description: source.description,
            fromName: source.fromName,
            fromEmail: source.fromEmail,
            replyTo: source.replyTo,
            subject: source.subject,
            previewText: source.previewText,
            htmlBody: source.htmlBody,
            textBody: source.textBody,
            timezone: source.timezone,
            templateId: source.templateId,
            clientId: source.clientId,
            projectId: source.projectId,
            createdById: ctx.user.id!,
          },
        });
        await replaceCampaignRules(tx, campaign.id, {
          includeContactIds: source.contactRules
            .filter((row) => row.ruleType === "INCLUDE")
            .map((row) => row.contactId),
          excludeContactIds: source.contactRules
            .filter((row) => row.ruleType === "EXCLUDE")
            .map((row) => row.contactId),
          includeTagIds: source.tagRules
            .filter((row) => row.ruleType === "INCLUDE")
            .map((row) => row.tagId),
          excludeTagIds: source.tagRules
            .filter((row) => row.ruleType === "EXCLUDE")
            .map((row) => row.tagId),
          includeSegmentIds: source.segmentRules
            .filter((row) => row.ruleType === "INCLUDE")
            .map((row) => row.segmentId),
          excludeSegmentIds: source.segmentRules
            .filter((row) => row.ruleType === "EXCLUDE")
            .map((row) => row.segmentId),
        });
        return campaign;
      });
    }),
  launch: marketingAdminProcedure
    .input(
      z.object({ id: z.string(), scheduledAt: z.coerce.date().optional() }),
    )
    .mutation(async ({ ctx, input }) => {
      const scheduledAt = input.scheduledAt ?? new Date();
      const campaign = await queueCampaign(ctx.prisma, input.id, scheduledAt);
      if (scheduledAt.getTime() <= Date.now() + 5_000)
        await processCampaignBatch(ctx.prisma, campaign.id);
      return ctx.prisma.emailCampaign.findUnique({
        where: { id: campaign.id },
      });
    }),
  cancel: marketingAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findUnique({
        where: { id: input.id },
      });
      if (!campaign || !["SCHEDULED", "PAUSED"].includes(campaign.status))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Campaign cannot be cancelled now",
        });
      await ctx.prisma.emailCampaignRecipient.updateMany({
        where: { campaignId: input.id, status: "QUEUED" },
        data: { status: "CANCELLED" },
      });
      return ctx.prisma.emailCampaign.update({
        where: { id: input.id },
        data: { status: "CANCELLED", completedAt: new Date() },
      });
    }),
  retryFailed: marketingAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => ({
      count: await retryFailedCampaignRecipients(ctx.prisma, input.id),
    })),
});

const automationStep = z.object({
  action: z.enum(["SEND_EMAIL", "WAIT", "ADD_TAG", "REMOVE_TAG", "END"]),
  delayMinutes: z.number().int().min(0).max(525_600).default(0),
  templateId: z.string().optional(),
  tagId: z.string().optional(),
});

const automationsRouter = router({
  list: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.emailAutomation.findMany({
      include: {
        steps: { orderBy: { position: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ),
  create: marketingAdminProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(160),
        description: optionalText,
        trigger: z.enum([
          "CONTACT_ADDED",
          "TAG_ADDED",
          "BIRTHDAY",
          "DATE_BASED",
          "SUBSCRIPTION_CONFIRMED",
        ]),
        triggerConfig: z.record(z.unknown()).default({}),
        steps: z.array(automationStep).min(1).max(50),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.emailAutomation.create({
        data: {
          name: input.name,
          description: input.description,
          trigger: input.trigger,
          triggerConfig: input.triggerConfig as Prisma.InputJsonValue,
          createdById: ctx.user.id!,
          steps: {
            create: input.steps.map((step, position) => ({
              position,
              action: step.action,
              delayMinutes: step.delayMinutes,
              config: {
                ...(step.templateId && { templateId: step.templateId }),
                ...(step.tagId && { tagId: step.tagId }),
              },
            })),
          },
        },
        include: { steps: true },
      }),
    ),
  toggle: marketingAdminProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.emailAutomation.update({
        where: { id: input.id },
        data: { status: input.active ? "ACTIVE" : "PAUSED" },
      }),
    ),
  enrollments: marketingProcedure
    .input(z.object({ automationId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.emailAutomationEnrollment.findMany({
        where: { automationId: input.automationId },
        include: { contact: true, logs: { orderBy: { createdAt: "desc" } } },
        orderBy: { startedAt: "desc" },
        take: 100,
      }),
    ),
});

const inboxRouter = router({
  list: marketingProcedure
    .input(
      z
        .object({
          status: z.enum(["UNREAD", "OPEN", "DONE", "TRASHED"]).optional(),
        })
        .default({}),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.marketingInboundMessage.findMany({
        where: input.status ? { status: input.status } : {},
        include: {
          contact: true,
          assignedTo: { select: { id: true, name: true } },
          notes: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { receivedAt: "desc" },
        take: 200,
      }),
    ),
  update: marketingProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["UNREAD", "OPEN", "DONE", "TRASHED"]).optional(),
        assignedToId: z.string().optional().nullable(),
      }),
    )
    .mutation(({ ctx, input: { id, ...data } }) =>
      ctx.prisma.marketingInboundMessage.update({ where: { id }, data }),
    ),
  addNote: marketingProcedure
    .input(
      z.object({
        messageId: z.string(),
        body: z.string().trim().min(1).max(5_000),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.marketingInboxNote.create({
        data: { ...input, authorId: ctx.user.id! },
      }),
    ),
});

const settingsRouter = router({
  get: marketingProcedure.query(async ({ ctx }) => {
    const stored = await ctx.prisma.emailMarketingSettings.findUnique({
      where: { id: "system" },
    });
    return {
      ...DEFAULT_EMAIL_MARKETING_SETTINGS,
      ...stored,
      providerConfigured: Boolean(process.env.RESEND_API_KEY),
      webhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET),
    };
  }),
  update: marketingAdminProcedure
    .input(
      z.object({
        fromName: z.string().trim().min(1).max(120),
        fromEmail: email,
        replyTo: z
          .union([email, z.literal("")])
          .optional()
          .nullable()
          .transform((value) => value || null),
        inboundAddress: z
          .union([email, z.literal("")])
          .optional()
          .nullable()
          .transform((value) => value || null),
        trackOpens: z.boolean(),
        trackClicks: z.boolean(),
        companyName: z.string().trim().min(1).max(160),
        companyAddress: z.string().trim().max(500),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.emailMarketingSettings.upsert({
        where: { id: "system" },
        create: { ...input, updatedById: ctx.user.id! },
        update: { ...input, updatedById: ctx.user.id! },
      }),
    ),
});

export const emailMarketingRouter = router({
  overview: marketingProcedure.query(async ({ ctx }) => {
    const [
      contacts,
      subscribers,
      campaigns,
      scheduled,
      templates,
      automations,
      unread,
      suppressions,
      recentCampaigns,
    ] = await Promise.all([
      ctx.prisma.marketingContact.count({
        where: { status: { not: "ARCHIVED" } },
      }),
      ctx.prisma.marketingContact.count({ where: { status: "SUBSCRIBED" } }),
      ctx.prisma.emailCampaign.count(),
      ctx.prisma.emailCampaign.count({
        where: { status: { in: ["SCHEDULED", "SENDING"] } },
      }),
      ctx.prisma.emailTemplate.count({ where: { status: "ACTIVE" } }),
      ctx.prisma.emailAutomation.count({ where: { status: "ACTIVE" } }),
      ctx.prisma.marketingInboundMessage.count({ where: { status: "UNREAD" } }),
      ctx.prisma.emailSuppression.count(),
      ctx.prisma.emailCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
    const totals = recentCampaigns.reduce(
      (value, campaign) => ({
        sent: value.sent + campaign.sentCount,
        delivered: value.delivered + campaign.deliveredCount,
        opened: value.opened + campaign.openedCount,
        clicked: value.clicked + campaign.clickedCount,
        failed: value.failed + campaign.failedCount,
      }),
      { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
    );
    return {
      contacts,
      subscribers,
      campaigns,
      scheduled,
      templates,
      automations,
      unread,
      suppressions,
      totals,
      recentCampaigns,
    };
  }),
  lookups: marketingProcedure.query(async ({ ctx }) => {
    const [contacts, tags, segments, templates, clients, projects, users] =
      await Promise.all([
        ctx.prisma.marketingContact.findMany({
          where: { status: "SUBSCRIBED" },
          select: { id: true, email: true, firstName: true, lastName: true },
          orderBy: { email: "asc" },
          take: 5_000,
        }),
        ctx.prisma.marketingTag.findMany({ orderBy: { name: "asc" } }),
        ctx.prisma.marketingSegment.findMany({ orderBy: { name: "asc" } }),
        ctx.prisma.emailTemplate.findMany({
          where: { status: "ACTIVE" },
          orderBy: { name: "asc" },
        }),
        ctx.prisma.user.findMany({
          where: { role: "CLIENT", status: "ACTIVE" },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        }),
        ctx.prisma.clientProject.findMany({
          select: { id: true, name: true, clientId: true },
          orderBy: { name: "asc" },
        }),
        ctx.prisma.user.findMany({
          where: { role: { in: ["ADMIN", "MEMBER"] }, status: "ACTIVE" },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        }),
      ]);
    return { contacts, tags, segments, templates, clients, projects, users };
  }),
  delivery: marketingProcedure
    .input(
      z
        .object({
          campaignId: z.string().optional(),
          status: z
            .enum([
              "QUEUED",
              "SENT",
              "DELIVERED",
              "DEFERRED",
              "BOUNCED",
              "COMPLAINED",
              "FAILED",
              "SUPPRESSED",
              "OPENED",
              "CLICKED",
              "CANCELLED",
            ])
            .optional(),
        })
        .default({}),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.emailCampaignRecipient.findMany({
        where: {
          ...(input.campaignId && { campaignId: input.campaignId }),
          ...(input.status && { status: input.status }),
        },
        include: {
          campaign: { select: { id: true, name: true } },
          events: { orderBy: { eventAt: "desc" }, take: 10 },
        },
        orderBy: { updatedAt: "desc" },
        take: 250,
      }),
    ),
  suppressions: marketingProcedure.query(({ ctx }) =>
    ctx.prisma.emailSuppression.findMany({
      orderBy: { suppressedAt: "desc" },
      take: 500,
    }),
  ),
  contacts: contactsRouter,
  tags: tagsRouter,
  segments: segmentsRouter,
  sources: sourcesRouter,
  templates: templatesRouter,
  campaigns: campaignsRouter,
  automations: automationsRouter,
  inbox: inboxRouter,
  settings: settingsRouter,
});
