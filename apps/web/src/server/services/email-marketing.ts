import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "@arko/db";
import { Resend, type WebhookEventPayload } from "resend";

type DbClient = PrismaClient | Prisma.TransactionClient;

const CAMPAIGN_BATCH_SIZE = 50;
const AUTOMATION_BATCH_SIZE = 25;

export const DEFAULT_EMAIL_MARKETING_SETTINGS = {
  id: "system",
  provider: "RESEND",
  fromName: "ARKO",
  fromEmail: "marketing@arkodevph.com",
  replyTo: null as string | null,
  inboundAddress: null as string | null,
  trackOpens: true,
  trackClicks: true,
  companyName: "ARKO",
  companyAddress: "",
};

export function normalizeMarketingEmail(email: string) {
  return email.trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type ContactTemplateData = {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  email: string;
  unsubscribeToken: string;
};

export function renderMarketingTemplate(
  value: string,
  contact: ContactTemplateData,
) {
  const variables: Record<string, string> = {
    first_name: contact.firstName ?? "",
    last_name: contact.lastName ?? "",
    full_name: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    company: contact.company ?? "",
    email: contact.email,
  };

  return value.replace(
    /{{\s*([a-z_]+)\s*}}/gi,
    (_match, key: string) => variables[key.toLowerCase()] ?? "",
  );
}

function unsubscribeUrl(contact: ContactTemplateData) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${baseUrl}/api/email-marketing/unsubscribe/${encodeURIComponent(contact.unsubscribeToken)}`;
}

function renderCampaignContent(
  campaign: {
    htmlBody: string;
    textBody: string | null;
    previewText: string | null;
  },
  contact: ContactTemplateData,
  settings: typeof DEFAULT_EMAIL_MARKETING_SETTINGS,
) {
  const url = unsubscribeUrl(contact);
  const preview = campaign.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(renderMarketingTemplate(campaign.previewText, contact))}</div>`
    : "";
  const address = settings.companyAddress
    ? `<div>${escapeHtml(settings.companyAddress)}</div>`
    : "";
  const footer = `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font:12px/1.5 Arial,sans-serif"><div>${escapeHtml(settings.companyName)}</div>${address}<div><a href="${escapeHtml(url)}">Unsubscribe or manage preferences</a></div></div>`;

  return {
    html: `${preview}${renderMarketingTemplate(campaign.htmlBody, contact)}${footer}`,
    text: `${renderMarketingTemplate(campaign.textBody || campaign.previewText || "", contact)}\n\n${settings.companyName}${settings.companyAddress ? `\n${settings.companyAddress}` : ""}\nUnsubscribe: ${url}`.trim(),
    unsubscribeUrl: url,
  };
}

async function marketingSettings(db: DbClient) {
  const stored = await db.emailMarketingSettings.findUnique({
    where: { id: "system" },
  });
  return { ...DEFAULT_EMAIL_MARKETING_SETTINGS, ...stored };
}

async function idsForRules(
  db: DbClient,
  campaignId: string,
  ruleType: "INCLUDE" | "EXCLUDE",
) {
  const [direct, tags, segments] = await Promise.all([
    db.emailCampaignContact.findMany({
      where: { campaignId, ruleType },
      select: { contactId: true },
    }),
    db.emailCampaignTag.findMany({
      where: { campaignId, ruleType },
      select: { tagId: true },
    }),
    db.emailCampaignSegment.findMany({
      where: { campaignId, ruleType },
      select: { segmentId: true },
    }),
  ]);

  const ids = new Set(direct.map((row) => row.contactId));
  if (tags.length) {
    const rows = await db.marketingContactTag.findMany({
      where: { tagId: { in: tags.map((row) => row.tagId) } },
      select: { contactId: true },
    });
    rows.forEach((row) => ids.add(row.contactId));
  }
  if (segments.length) {
    const rows = await db.marketingSegmentMember.findMany({
      where: { segmentId: { in: segments.map((row) => row.segmentId) } },
      select: { contactId: true },
    });
    rows.forEach((row) => ids.add(row.contactId));
  }
  return ids;
}

export async function resolveCampaignAudience(
  db: DbClient,
  campaignId: string,
) {
  const included = await idsForRules(db, campaignId, "INCLUDE");
  const excluded = await idsForRules(db, campaignId, "EXCLUDE");
  const selectedIds = [...included].filter((id) => !excluded.has(id));

  if (!selectedIds.length) {
    return {
      contacts: [],
      counts: {
        selected: included.size,
        excluded: excluded.size,
        suppressed: 0,
        eligible: 0,
      },
    };
  }

  const selected = await db.marketingContact.findMany({
    where: { id: { in: selectedIds } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      company: true,
      status: true,
      unsubscribeToken: true,
    },
  });
  const suppressed = await db.emailSuppression.findMany({
    where: { email: { in: selected.map((contact) => contact.email) } },
    select: { email: true },
  });
  const suppressedEmails = new Set(
    suppressed.map((row) => normalizeMarketingEmail(row.email)),
  );
  const contacts = selected.filter(
    (contact) =>
      contact.status === "SUBSCRIBED" &&
      !suppressedEmails.has(normalizeMarketingEmail(contact.email)),
  );

  return {
    contacts,
    counts: {
      selected: included.size,
      excluded: excluded.size,
      suppressed: selected.length - contacts.length,
      eligible: contacts.length,
    },
  };
}

export async function snapshotCampaignRecipients(
  db: PrismaClient,
  campaignId: string,
) {
  return db.$transaction(async (tx) => {
    const campaign = await tx.emailCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.status !== "DRAFT")
      throw new Error("Only draft campaigns can create a recipient snapshot");

    const audience = await resolveCampaignAudience(tx, campaignId);
    if (!audience.contacts.length)
      throw new Error("Campaign has no eligible recipients");

    await tx.emailCampaignRecipient.deleteMany({ where: { campaignId } });
    await tx.emailCampaignRecipient.createMany({
      data: audience.contacts.map((contact) => ({
        campaignId,
        contactId: contact.id,
        email: normalizeMarketingEmail(contact.email),
        firstName: contact.firstName,
        lastName: contact.lastName,
      })),
    });
    await tx.emailCampaign.update({
      where: { id: campaignId },
      data: { recipientCount: audience.contacts.length },
    });
    return audience;
  });
}

export async function queueCampaign(
  db: PrismaClient,
  campaignId: string,
  scheduledAt: Date,
) {
  await snapshotCampaignRecipients(db, campaignId);
  return db.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SCHEDULED", scheduledAt },
  });
}

async function refreshCampaignMetrics(db: DbClient, campaignId: string) {
  const grouped = await db.emailCampaignRecipient.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { _all: true },
  });
  const count = (states: string[]) =>
    grouped
      .filter((row) => states.includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);
  const pending = count(["QUEUED"]);
  const failed = count(["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"]);

  return db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount: count(["SENT", "DELIVERED", "DEFERRED", "OPENED", "CLICKED"]),
      deliveredCount: count(["DELIVERED", "OPENED", "CLICKED"]),
      failedCount: failed,
      openedCount: count(["OPENED", "CLICKED"]),
      clickedCount: count(["CLICKED"]),
      ...(pending === 0 && {
        status: "SENT",
        completedAt: new Date(),
      }),
    },
  });
}

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(apiKey);
}

function resendInboundClient() {
  const apiKey = process.env.RESEND_INBOUND_API_KEY;
  if (!apiKey)
    throw new Error("RESEND_INBOUND_API_KEY is not configured");
  return new Resend(apiKey);
}

export async function sendMarketingTestEmail(
  db: DbClient,
  input: { to: string; subject: string; html: string; text?: string | null },
) {
  const settings = await marketingSettings(db);
  const response = await resendClient().emails.send({
    from: `${settings.fromName} <${settings.fromEmail}>`,
    to: normalizeMarketingEmail(input.to),
    ...(settings.replyTo && { replyTo: settings.replyTo }),
    subject: `[TEST] ${input.subject}`,
    html: input.html,
    text: input.text || "ARKO email marketing test message",
    tags: [{ name: "message_type", value: "test" }],
  });
  if (response.error) throw new Error(response.error.message);
  return response.data;
}

export async function processCampaignBatch(
  db: PrismaClient,
  campaignId: string,
) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        where: { status: "QUEUED" },
        orderBy: { queuedAt: "asc" },
        take: CAMPAIGN_BATCH_SIZE,
        include: { contact: true },
      },
    },
  });
  if (!campaign || !["SCHEDULED", "SENDING"].includes(campaign.status))
    return null;
  if (!campaign.recipients.length)
    return refreshCampaignMetrics(db, campaignId);

  await db.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", startedAt: campaign.startedAt ?? new Date() },
  });

  const settings = await marketingSettings(db);
  const resend = resendClient();
  const messages = campaign.recipients.map((recipient) => {
    if (!recipient.contact)
      throw new Error(
        `Recipient ${recipient.id} no longer has a contact record`,
      );
    const content = renderCampaignContent(
      campaign,
      recipient.contact,
      settings,
    );
    return {
      from: `${campaign.fromName} <${campaign.fromEmail}>`,
      to: recipient.email,
      ...(campaign.replyTo && { replyTo: campaign.replyTo }),
      subject: renderMarketingTemplate(campaign.subject, recipient.contact),
      html: content.html,
      text: content.text,
      headers: {
        "List-Unsubscribe": `<${content.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-ARKO-Campaign-ID": campaign.id,
      },
      tags: [
        { name: "campaign_id", value: campaign.id },
        { name: "recipient_id", value: recipient.id },
      ],
    };
  });
  const digest = createHash("sha256")
    .update(campaign.recipients.map((recipient) => recipient.id).join(":"))
    .digest("hex")
    .slice(0, 32);

  try {
    const response = await resend.batch.send(messages, {
      idempotencyKey: `arko-campaign-${campaign.id}-${digest}`,
    });
    if (response.error || !response.data)
      throw new Error(
        response.error?.message || "Resend returned no delivery identifiers",
      );

    await db.$transaction(
      campaign.recipients.map((recipient, index) =>
        db.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            providerEmailId: response.data?.data[index]?.id,
            sentAt: new Date(),
            errorMessage: null,
          },
        }),
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email provider request failed";
    await db.emailCampaignRecipient.updateMany({
      where: {
        id: { in: campaign.recipients.map((recipient) => recipient.id) },
        status: "QUEUED",
      },
      data: { status: "FAILED", failedAt: new Date(), errorMessage: message },
    });
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: "FAILED",
        failedCount: { increment: campaign.recipients.length },
      },
    });
    throw error;
  }

  return refreshCampaignMetrics(db, campaignId);
}

export async function processDueEmailMarketing(db: PrismaClient) {
  const due = await db.emailCampaign.findMany({
    where: {
      OR: [
        { status: "SENDING" },
        { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    take: 5,
    select: { id: true },
  });

  const campaignResults = [];
  for (const campaign of due) {
    try {
      await processCampaignBatch(db, campaign.id);
      campaignResults.push({ id: campaign.id, status: "processed" });
    } catch (error) {
      campaignResults.push({
        id: campaign.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const automationResults = await processAutomationEnrollments(db);
  return { campaigns: campaignResults, automations: automationResults };
}

export async function retryFailedCampaignRecipients(
  db: PrismaClient,
  campaignId: string,
) {
  const campaign = await db.emailCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign || !["FAILED", "SENT"].includes(campaign.status))
    throw new Error("Campaign is not eligible for retry");
  const retried = await db.emailCampaignRecipient.updateMany({
    where: { campaignId, status: "FAILED" },
    data: { status: "QUEUED", failedAt: null, errorMessage: null },
  });
  if (!retried.count)
    throw new Error("Campaign has no failed recipients to retry");
  await db.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", completedAt: null },
  });
  return retried.count;
}

type EmailDeliveryWebhookPayload = Exclude<
  WebhookEventPayload,
  | { type: "email.received" }
  | { type: "contact.created" | "contact.updated" | "contact.deleted" }
  | { type: "domain.created" | "domain.updated" | "domain.deleted" }
  | { type: "suppression.added" | "suppression.removed" }
>;

const deliveryEventTypes = new Set<EmailDeliveryWebhookPayload["type"]>([
  "email.sent",
  "email.scheduled",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.opened",
  "email.clicked",
  "email.failed",
  "email.suppressed",
]);

function isEmailDeliveryEvent(
  event: WebhookEventPayload,
): event is EmailDeliveryWebhookPayload {
  return deliveryEventTypes.has(
    event.type as EmailDeliveryWebhookPayload["type"],
  );
}

function recipientStatusForEvent(type: EmailDeliveryWebhookPayload["type"]) {
  const statusByType: Record<
    EmailDeliveryWebhookPayload["type"],
    | "SENT"
    | "QUEUED"
    | "DELIVERED"
    | "DEFERRED"
    | "COMPLAINED"
    | "BOUNCED"
    | "OPENED"
    | "CLICKED"
    | "FAILED"
    | "SUPPRESSED"
  > = {
    "email.sent": "SENT",
    "email.scheduled": "QUEUED",
    "email.delivered": "DELIVERED",
    "email.delivery_delayed": "DEFERRED",
    "email.complained": "COMPLAINED",
    "email.bounced": "BOUNCED",
    "email.opened": "OPENED",
    "email.clicked": "CLICKED",
    "email.failed": "FAILED",
    "email.suppressed": "SUPPRESSED",
  };
  return statusByType[type];
}

export async function recordResendWebhook(
  db: PrismaClient,
  event: WebhookEventPayload,
  providerEventId: string,
) {
  const existing = await db.emailDeliveryEvent.findUnique({
    where: { providerEventId },
  });
  if (existing) return { duplicate: true };

  if (event.type === "email.received") {
    const resend = resendInboundClient();
    const received = await resend.emails.receiving.get(event.data.email_id);
    if (received.error || !received.data)
      throw new Error(
        received.error?.message || "Could not retrieve inbound email",
      );
    const senderEmail = normalizeMarketingEmail(
      received.data.from.match(/<([^>]+)>/)?.[1] ?? received.data.from,
    );
    const senderName = received.data.from.includes("<")
      ? received.data.from.split("<")[0]?.trim()
      : null;
    const contact = await db.marketingContact.findUnique({
      where: { email: senderEmail },
    });
    await db.marketingInboundMessage.upsert({
      where: { providerMessageId: event.data.email_id },
      update: {},
      create: {
        providerMessageId: event.data.email_id,
        senderName,
        senderEmail,
        recipientEmail: received.data.to[0] ?? null,
        subject: received.data.subject || "(No subject)",
        textBody: received.data.text,
        htmlBody: received.data.html,
        contactId: contact?.id,
        receivedAt: new Date(received.data.created_at),
      },
    });
    await db.emailDeliveryEvent.create({
      data: {
        providerEventId,
        providerEmailId: event.data.email_id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
        eventAt: new Date(event.created_at),
      },
    });
    const users = await db.user.findMany({
      where: { role: { in: ["ADMIN", "MEMBER"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (users.length) {
      await db.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          notifType: "EMAIL_MARKETING_REPLY",
          title: `New email reply from ${senderName || senderEmail}`,
          message: received.data.subject || "(No subject)",
          link: "/dashboard/email-marketing?section=inbox",
        })),
      });
    }
    return { duplicate: false, received: true };
  }

  if (event.type === "suppression.added") {
    const reason =
      event.data.origin === "bounce"
        ? "BOUNCE"
        : event.data.origin === "complaint"
          ? "COMPLAINT"
          : "MANUAL";
    const email = normalizeMarketingEmail(event.data.email);
    await db.$transaction([
      db.emailSuppression.upsert({
        where: { email },
        create: { email, reason, source: "RESEND_WEBHOOK" },
        update: {
          reason,
          source: "RESEND_WEBHOOK",
          suppressedAt: new Date(event.created_at),
        },
      }),
      db.marketingContact.updateMany({
        where: { email },
        data: {
          status:
            reason === "BOUNCE"
              ? "BOUNCED"
              : reason === "COMPLAINT"
                ? "COMPLAINED"
                : "UNSUBSCRIBED",
        },
      }),
      db.emailDeliveryEvent.create({
        data: {
          providerEventId,
          type: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
          eventAt: new Date(event.created_at),
        },
      }),
    ]);
    return { duplicate: false, suppression: "added" };
  }

  if (event.type === "suppression.removed") {
    const email = normalizeMarketingEmail(event.data.email);
    await db.$transaction([
      db.emailSuppression.deleteMany({ where: { email } }),
      db.emailDeliveryEvent.create({
        data: {
          providerEventId,
          type: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
          eventAt: new Date(event.created_at),
        },
      }),
    ]);
    return { duplicate: false, suppression: "removed" };
  }

  if (!isEmailDeliveryEvent(event)) return { duplicate: false, ignored: true };

  const recipient = await db.emailCampaignRecipient.findUnique({
    where: { providerEmailId: event.data.email_id },
  });
  await db.emailDeliveryEvent.create({
    data: {
      providerEventId,
      providerEmailId: event.data.email_id,
      recipientId: recipient?.id,
      type: event.type,
      payload: event as unknown as Prisma.InputJsonValue,
      eventAt: new Date(event.created_at),
    },
  });
  if (!recipient) return { duplicate: false, unmatched: true };

  const status = recipientStatusForEvent(event.type);
  if (status) {
    const at = new Date(event.created_at);
    const currentStatus = recipient.status;
    const nextStatus =
      status === "QUEUED" && currentStatus !== "QUEUED"
        ? currentStatus
        : status === "SENT" && !["QUEUED", "SENT"].includes(currentStatus)
          ? currentStatus
          : status === "DELIVERED" &&
              ["OPENED", "CLICKED"].includes(currentStatus)
            ? currentStatus
            : status === "OPENED" && currentStatus === "CLICKED"
              ? currentStatus
              : status;
    await db.emailCampaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: nextStatus,
        ...(status === "SENT" && { sentAt: at }),
        ...(status === "DELIVERED" && { deliveredAt: at }),
        ...(status === "OPENED" && { openedAt: at }),
        ...(status === "CLICKED" && { clickedAt: at }),
        ...(["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"].includes(
          status,
        ) && { failedAt: at }),
      },
    });
  }

  if (
    ["email.bounced", "email.complained", "email.suppressed"].includes(
      event.type,
    )
  ) {
    const reason =
      event.type === "email.bounced"
        ? "BOUNCE"
        : event.type === "email.complained"
          ? "COMPLAINT"
          : "MANUAL";
    await db.emailSuppression.upsert({
      where: { email: recipient.email },
      create: { email: recipient.email, reason, source: "RESEND_WEBHOOK" },
      update: {
        reason,
        source: "RESEND_WEBHOOK",
        suppressedAt: new Date(event.created_at),
      },
    });
    if (recipient.contactId) {
      await db.marketingContact.update({
        where: { id: recipient.contactId },
        data: {
          status:
            reason === "BOUNCE"
              ? "BOUNCED"
              : reason === "COMPLAINT"
                ? "COMPLAINED"
                : "UNSUBSCRIBED",
        },
      });
    }
  }

  await refreshCampaignMetrics(db, recipient.campaignId);
  return { duplicate: false, matched: true };
}

export async function unsubscribeMarketingContact(
  db: PrismaClient,
  token: string,
) {
  const contact = await db.marketingContact.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!contact) return null;
  await db.$transaction([
    db.marketingContact.update({
      where: { id: contact.id },
      data: { status: "UNSUBSCRIBED" },
    }),
    db.emailSuppression.upsert({
      where: { email: contact.email },
      create: {
        email: contact.email,
        reason: "UNSUBSCRIBED",
        source: "ONE_CLICK",
      },
      update: {
        reason: "UNSUBSCRIBED",
        source: "ONE_CLICK",
        suppressedAt: new Date(),
      },
    }),
  ]);
  return contact;
}

export async function enrollContactForTrigger(
  db: PrismaClient,
  contactId: string,
  trigger: "CONTACT_ADDED" | "TAG_ADDED" | "SUBSCRIPTION_CONFIRMED",
  triggerKey: string,
) {
  const automations = await db.emailAutomation.findMany({
    where: { status: "ACTIVE", trigger },
    include: { steps: { orderBy: { position: "asc" }, take: 1 } },
  });
  let count = 0;
  for (const automation of automations) {
    const config = (automation.triggerConfig ?? {}) as Record<string, unknown>;
    if (trigger === "TAG_ADDED" && config.tagId && config.tagId !== triggerKey)
      continue;
    const first = automation.steps[0];
    await db.emailAutomationEnrollment.upsert({
      where: {
        automationId_contactId_runKey: {
          automationId: automation.id,
          contactId,
          runKey: triggerKey,
        },
      },
      update: {},
      create: {
        automationId: automation.id,
        contactId,
        runKey: triggerKey,
        nextRunAt: new Date(Date.now() + (first?.delayMinutes ?? 0) * 60_000),
      },
    });
    count += 1;
  }
  return count;
}

async function createCalendarEnrollments(db: PrismaClient) {
  const automations = await db.emailAutomation.findMany({
    where: { status: "ACTIVE", trigger: { in: ["BIRTHDAY", "DATE_BASED"] } },
    include: { steps: { orderBy: { position: "asc" }, take: 1 } },
  });
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);
  for (const automation of automations) {
    const config = (automation.triggerConfig ?? {}) as Record<string, unknown>;
    if (automation.trigger === "DATE_BASED" && config.date !== dayKey) continue;
    const contacts = await db.marketingContact.findMany({
      where: {
        status: "SUBSCRIBED",
        ...(automation.trigger === "BIRTHDAY" && { birthday: { not: null } }),
        ...(typeof config.segmentId === "string" && {
          segments: { some: { segmentId: config.segmentId } },
        }),
      },
      select: { id: true, birthday: true },
    });
    const eligible = contacts.filter(
      (contact) =>
        automation.trigger !== "BIRTHDAY" ||
        (contact.birthday &&
          contact.birthday.getUTCMonth() === now.getUTCMonth() &&
          contact.birthday.getUTCDate() === now.getUTCDate()),
    );
    for (const contact of eligible) {
      await db.emailAutomationEnrollment.upsert({
        where: {
          automationId_contactId_runKey: {
            automationId: automation.id,
            contactId: contact.id,
            runKey: dayKey,
          },
        },
        update: {},
        create: {
          automationId: automation.id,
          contactId: contact.id,
          runKey: dayKey,
          nextRunAt: new Date(
            Date.now() + (automation.steps[0]?.delayMinutes ?? 0) * 60_000,
          ),
        },
      });
    }
  }
}

async function processAutomationEnrollments(db: PrismaClient) {
  await createCalendarEnrollments(db);
  const enrollments = await db.emailAutomationEnrollment.findMany({
    where: {
      status: { in: ["PENDING", "RUNNING"] },
      nextRunAt: { lte: new Date() },
      automation: { status: "ACTIVE" },
    },
    include: {
      contact: true,
      automation: { include: { steps: { orderBy: { position: "asc" } } } },
    },
    take: AUTOMATION_BATCH_SIZE,
    orderBy: { nextRunAt: "asc" },
  });
  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const enrollment of enrollments) {
    const step = enrollment.automation.steps[enrollment.currentStep];
    if (!step || step.action === "END") {
      await db.emailAutomationEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED", completedAt: new Date(), nextRunAt: null },
      });
      results.push({ id: enrollment.id, status: "completed" });
      continue;
    }

    try {
      const config = (step.config ?? {}) as Record<string, unknown>;
      if (step.action === "SEND_EMAIL") {
        const suppressed = await db.emailSuppression.findUnique({
          where: { email: enrollment.contact.email },
        });
        if (enrollment.contact.status !== "SUBSCRIBED" || suppressed)
          throw new Error("Contact is not eligible for marketing email");
        const templateId =
          typeof config.templateId === "string" ? config.templateId : "";
        const template = await db.emailTemplate.findUnique({
          where: { id: templateId },
        });
        if (!template || template.status !== "ACTIVE")
          throw new Error("Automation template is unavailable");
        const settings = await marketingSettings(db);
        const content = renderCampaignContent(
          template,
          enrollment.contact,
          settings,
        );
        const response = await resendClient().emails.send(
          {
            from: `${settings.fromName} <${settings.fromEmail}>`,
            to: enrollment.contact.email,
            ...(settings.replyTo && { replyTo: settings.replyTo }),
            subject: renderMarketingTemplate(
              template.subject,
              enrollment.contact,
            ),
            html: content.html,
            text: content.text,
            headers: {
              "List-Unsubscribe": `<${content.unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
            tags: [{ name: "automation_id", value: enrollment.automationId }],
          },
          { idempotencyKey: `arko-automation-${enrollment.id}-${step.id}` },
        );
        if (response.error) throw new Error(response.error.message);
        config.providerEmailId = response.data?.id;
      } else if (step.action === "ADD_TAG" || step.action === "REMOVE_TAG") {
        const tagId = typeof config.tagId === "string" ? config.tagId : "";
        if (!tagId) throw new Error("Automation tag is missing");
        if (step.action === "ADD_TAG") {
          await db.marketingContactTag.upsert({
            where: {
              contactId_tagId: { contactId: enrollment.contactId, tagId },
            },
            update: {},
            create: { contactId: enrollment.contactId, tagId },
          });
          await enrollContactForTrigger(
            db,
            enrollment.contactId,
            "TAG_ADDED",
            tagId,
          );
        } else {
          await db.marketingContactTag.deleteMany({
            where: { contactId: enrollment.contactId, tagId },
          });
        }
      }

      await db.emailAutomationExecutionLog.create({
        data: {
          enrollmentId: enrollment.id,
          stepId: step.id,
          status: "COMPLETED",
          message: `${step.action} completed`,
          details: config as Prisma.InputJsonValue,
        },
      });
      const nextIndex = enrollment.currentStep + 1;
      const nextStep = enrollment.automation.steps[nextIndex];
      await db.emailAutomationEnrollment.update({
        where: { id: enrollment.id },
        data: nextStep
          ? {
              status: "RUNNING",
              currentStep: nextIndex,
              nextRunAt: new Date(Date.now() + nextStep.delayMinutes * 60_000),
              errorMessage: null,
            }
          : {
              status: "COMPLETED",
              currentStep: nextIndex,
              nextRunAt: null,
              completedAt: new Date(),
            },
      });
      results.push({
        id: enrollment.id,
        status: nextStep ? "advanced" : "completed",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Automation step failed";
      await db.emailAutomationExecutionLog.create({
        data: {
          enrollmentId: enrollment.id,
          stepId: step.id,
          status: "FAILED",
          message,
        },
      });
      await db.emailAutomationEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "FAILED", errorMessage: message, nextRunAt: null },
      });
      results.push({ id: enrollment.id, status: "failed", error: message });
    }
  }

  return results;
}
