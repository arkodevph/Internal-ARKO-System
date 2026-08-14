import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const shell = (eyebrow: string, heading: string, body: string, cta?: string) =>
  `
<div style="background:#f4f4f1;padding:32px 16px;font-family:Arial,sans-serif;color:#171717">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;padding:40px">
    <p style="margin:0 0 20px;font:700 11px/1.4 monospace;letter-spacing:.14em;text-transform:uppercase;color:#737373">${eyebrow}</p>
    <h1 style="margin:0 0 20px;font-size:32px;line-height:1.15">${heading}</h1>
    <div style="font-size:16px;line-height:1.7;color:#404040">${body}</div>
    ${cta ? `<p style="margin:28px 0 0"><a href="https://arkodevph.com" style="display:inline-block;border-radius:999px;background:#171717;color:#fff;padding:13px 22px;text-decoration:none;font-weight:700">${cta}</a></p>` : ""}
  </div>
</div>`.trim();

const templates = [
  {
    id: "starter-welcome",
    name: "Welcome to ARKO",
    description: "A warm introduction for newly subscribed contacts.",
    subject: "Welcome to ARKO, {{first_name}}",
    previewText: "Here is what you can expect from us.",
    htmlBody: shell(
      "Welcome",
      "Good to have you here, {{first_name}}.",
      "<p>Thanks for joining ARKO. We share practical ideas about better digital products, smoother operations, and technology that earns its place in your business.</p><p>Expect useful updates, selected project stories, and no inbox noise.</p>",
      "Explore ARKO",
    ),
    textBody:
      "Hi {{first_name}},\n\nThanks for joining ARKO. We share practical ideas about better digital products, smoother operations, and technology that earns its place in your business.\n\nExplore ARKO: https://arkodevph.com",
  },
  {
    id: "starter-discovery-follow-up",
    name: "Discovery Follow-up",
    description: "Follow up after an inquiry or discovery conversation.",
    subject: "Next steps for {{company}}",
    previewText: "A clear path from conversation to execution.",
    htmlBody: shell(
      "Next steps",
      "Let’s turn the conversation into a plan.",
      "<p>Hi {{first_name}},</p><p>Thanks for sharing what {{company}} is working toward. We can help shape the priorities, define the right technical approach, and move into delivery without unnecessary overhead.</p><p>Reply with a convenient time and we’ll map the next step together.</p>",
      "View our work",
    ),
    textBody:
      "Hi {{first_name}},\n\nThanks for sharing what {{company}} is working toward. Reply with a convenient time and we’ll map the next step together.\n\nOur work: https://arkodevph.com/projects",
  },
  {
    id: "starter-project-update",
    name: "Client Project Update",
    description: "A concise client-facing delivery and milestone update.",
    subject: "{{company}} project update",
    previewText: "Progress, decisions, and what happens next.",
    htmlBody: shell(
      "Project update",
      "Progress you can see.",
      "<p>Hi {{first_name}},</p><p>Here is the latest project update:</p><p><strong>Completed</strong><br>Replace this text with the work completed this period.</p><p><strong>In progress</strong><br>Replace this text with the active work and current status.</p><p><strong>Next</strong><br>Replace this text with the next milestone and any decision needed.</p>",
      "Open client portal",
    ),
    textBody:
      "Hi {{first_name}},\n\nCOMPLETED\nReplace with completed work.\n\nIN PROGRESS\nReplace with active work.\n\nNEXT\nReplace with the next milestone.\n\nClient portal: https://arkodevph.com/dashboard/client-portal",
  },
  {
    id: "starter-monthly-brief",
    name: "ARKO Monthly Brief",
    description:
      "A flexible newsletter for insights, launches, and project stories.",
    subject: "ARKO Brief — what we learned this month",
    previewText:
      "Useful ideas for building and operating better digital products.",
    htmlBody: shell(
      "Monthly brief",
      "A few things worth your attention.",
      "<p>Hi {{first_name}},</p><p><strong>01 — Lead story</strong><br>Add a concise insight your audience can apply.</p><p><strong>02 — From the studio</strong><br>Share a launch, case study, or behind-the-scenes decision.</p><p><strong>03 — One useful link</strong><br>Recommend a tool, article, or resource and explain why it matters.</p>",
      "See what we’re building",
    ),
    textBody:
      "Hi {{first_name}},\n\n01 — LEAD STORY\nAdd one useful insight.\n\n02 — FROM THE STUDIO\nShare a launch or case study.\n\n03 — ONE USEFUL LINK\nRecommend one resource.\n\nhttps://arkodevph.com/projects",
  },
  {
    id: "starter-reengagement",
    name: "Re-engagement Check-in",
    description: "A respectful check-in for contacts who have gone quiet.",
    subject: "Still useful, {{first_name}}?",
    previewText: "Tell us what you want to hear from ARKO.",
    htmlBody: shell(
      "Quick check-in",
      "Should we keep in touch?",
      "<p>Hi {{first_name}},</p><p>We only want to send work and ideas that are useful to you. If ARKO is still relevant, stay subscribed and we’ll keep future updates focused.</p><p>If your priorities have changed, you can unsubscribe using the link below. No hard feelings.</p>",
      "See the latest work",
    ),
    textBody:
      "Hi {{first_name}},\n\nWe only want to send work and ideas that are useful to you. If ARKO is still relevant, stay subscribed. Otherwise, use the unsubscribe link below.\n\nLatest work: https://arkodevph.com/projects",
  },
];

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("An active admin user is required");

  for (const source of ["Website inquiry", "Manual import", "Referral"]) {
    await prisma.marketingSource.upsert({
      where: { name: source },
      update: {},
      create: { name: source },
    });
  }

  for (const tag of [
    { name: "Lead", color: "#f59e0b" },
    { name: "Client", color: "#22c55e" },
    { name: "Newsletter", color: "#3b82f6" },
    { name: "Engaged", color: "#8b5cf6" },
    { name: "VIP", color: "#ef4444" },
  ]) {
    await prisma.marketingTag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: tag,
    });
  }

  for (const segment of [
    {
      name: "All subscribers",
      description: "Contacts currently eligible to receive marketing email.",
      type: "DYNAMIC" as const,
      filters: { status: "SUBSCRIBED" },
    },
    {
      name: "Warm leads",
      description: "A curated segment for qualified opportunities.",
      type: "STATIC" as const,
      filters: {},
    },
  ]) {
    await prisma.marketingSegment.upsert({
      where: { name: segment.name },
      update: {
        description: segment.description,
        type: segment.type,
        filters: segment.filters,
      },
      create: { ...segment, createdById: admin.id },
    });
  }

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { id: template.id },
      update: { ...template, status: "ACTIVE" },
      create: { ...template, status: "ACTIVE", createdById: admin.id },
    });
  }

  const engagedTag = await prisma.marketingTag.findUniqueOrThrow({
    where: { name: "Engaged" },
  });
  const leadTag = await prisma.marketingTag.findUniqueOrThrow({
    where: { name: "Lead" },
  });

  await prisma.emailAutomation.upsert({
    where: { id: "starter-welcome-sequence" },
    update: {},
    create: {
      id: "starter-welcome-sequence",
      name: "New subscriber welcome",
      description: "Welcome new subscribers and follow up after three days.",
      trigger: "SUBSCRIPTION_CONFIRMED",
      status: "DRAFT",
      createdById: admin.id,
      steps: {
        create: [
          {
            position: 0,
            action: "SEND_EMAIL",
            config: { templateId: "starter-welcome" },
          },
          { position: 1, action: "WAIT", delayMinutes: 4320 },
          {
            position: 2,
            action: "SEND_EMAIL",
            config: { templateId: "starter-monthly-brief" },
          },
          { position: 3, action: "ADD_TAG", config: { tagId: engagedTag.id } },
          { position: 4, action: "END" },
        ],
      },
    },
  });

  await prisma.emailAutomation.upsert({
    where: { id: "starter-lead-follow-up" },
    update: {},
    create: {
      id: "starter-lead-follow-up",
      name: "Lead follow-up",
      description:
        "Send a discovery follow-up when a contact receives the Lead tag.",
      trigger: "TAG_ADDED",
      triggerConfig: { tagId: leadTag.id },
      status: "DRAFT",
      createdById: admin.id,
      steps: {
        create: [
          {
            position: 0,
            action: "SEND_EMAIL",
            config: { templateId: "starter-discovery-follow-up" },
          },
          { position: 1, action: "END" },
        ],
      },
    },
  });

  console.log("Email marketing starter kit is ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
