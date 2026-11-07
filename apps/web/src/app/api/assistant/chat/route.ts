import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@arko/db";
import { auth } from "../../../../lib/auth";
import { hasPermission } from "../../../../lib/rbac";
import {
  assignedOrCompany,
  ownedOrCompany,
} from "../../../../lib/record-scope";
import {
  assistantMessageSchema,
  generateAssistantReply,
  isAssistantRequestInScope,
} from "../../../../server/services/assistant";
import {
  AssistantRateLimitError,
  consumeAssistantRequest,
} from "../../../../server/services/assistant-rate-limit";
import { getAssistantConfig } from "../../../../server/services/assistant-config";
import { getLandingTrafficStats } from "../../../../server/services/landing-analytics";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z.array(assistantMessageSchema).min(1).max(20),
  conversationId: z.string().cuid().optional(),
});

function assistantFailureMessage(error: unknown) {
  const details =
    error && typeof error === "object"
      ? (error as { message?: unknown; status?: unknown; code?: unknown })
      : undefined;
  const message =
    typeof details?.message === "string" ? details.message.toLowerCase() : "";
  const status = details?.status ?? details?.code;

  if (
    message.includes("not configured") ||
    message.includes("deployment identity")
  ) {
    return "NEX is not fully configured for this deployment. An administrator needs to finish the Vertex AI connection.";
  }
  if (
    status === 401 ||
    status === 403 ||
    message.includes("unauthenticated") ||
    message.includes("permission denied") ||
    message.includes("credential")
  ) {
    return "NEX could not authenticate with Vertex AI. An administrator needs to check the deployment identity and permissions.";
  }
  if (
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    message.includes("quota") ||
    message.includes("rate limit")
  ) {
    return "Vertex AI has reached its usage limit. Please try again later or ask an administrator to check the quota.";
  }
  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("fetch failed")
  ) {
    return "Vertex AI did not respond in time. Your request was not applied; please try again.";
  }
  if (error instanceof SyntaxError || error instanceof z.ZodError) {
    return "NEX received a response it could not safely process. Rephrase the request with the key details and try again.";
  }
  if (typeof details?.code === "string" && /^P\d{4}$/.test(details.code)) {
    return "NEX could not load or save the ARKO workspace data. Your requested change was not applied; please try again.";
  }
  return "NEX hit an unexpected server error. Your request was not applied. Please try again; if it continues, contact an administrator.";
}

async function saveExchange({
  conversationId,
  userId,
  userMessage,
  assistantMessage,
}: {
  conversationId?: string;
  userId: string;
  userMessage: string;
  assistantMessage: string;
}) {
  const messages = {
    create: [
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ],
  };

  if (conversationId) {
    return prisma.assistantConversation.update({
      where: { id: conversationId },
      data: { messages },
      select: { id: true },
    });
  }

  return prisma.assistantConversation.create({
    data: {
      userId,
      title: userMessage.slice(0, 60),
      messages,
    },
    select: { id: true },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role === "INTERN") return NextResponse.json({ error: "Intern accounts cannot access the main system." }, { status: 403 });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "DEMO") {
    return NextResponse.json(
      { error: "NEX workspace access is disabled in demo mode." },
      { status: 403 },
    );
  }

  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid chat request" },
      { status: 400 },
    );
  }

  const latestUserMessage = [...input.data.messages]
    .reverse()
    .find((message) => message.role === "user")?.content;
  if (!latestUserMessage) {
    return NextResponse.json(
      { error: "Invalid chat request" },
      { status: 400 },
    );
  }

  if (input.data.conversationId) {
    const conversation = await prisma.assistantConversation.findFirst({
      where: {
        id: input.data.conversationId,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }
  }

  if (!isAssistantRequestInScope(input.data.messages)) {
    const message =
      "I can only help with the ARKO system and the workspace information available to you.";
    const conversation = await saveExchange({
      conversationId: input.data.conversationId,
      userId: session.user.id,
      userMessage: latestUserMessage,
      assistantMessage: message,
    });
    return NextResponse.json({
      message,
      action: null,
      model: "scope-guard",
      conversationId: conversation.id,
    });
  }

  const role = session.user.role;
  const permissions = session.user.permissions;
  const canReadTasks = hasPermission(role, "tasks:read", permissions);

  try {
    await consumeAssistantRequest(session.user.id);
    const taskRows = canReadTasks
      ? await prisma.task.findMany({
          where: assignedOrCompany(session.user.id, role),
          orderBy: { updatedAt: "desc" },
          take: 41,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        })
      : [];
    const contextTruncated = taskRows.length > 40;
    const tasks = taskRows.slice(0, 40);
    const canReadEvents = hasPermission(role, "events:read", permissions);
    const events = canReadEvents
      ? await prisma.event.findMany({
          where: ownedOrCompany(session.user.id, role),
          orderBy: { date: "asc" },
          take: 30,
          select: {
            id: true,
            title: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        })
      : [];
    const canReadNotes = hasPermission(role, "notes:read", permissions);
    const notes = canReadNotes
      ? await prisma.note.findMany({
          where: ownedOrCompany(session.user.id, role),
          orderBy: { updatedAt: "desc" },
          take: 30,
          select: { id: true, title: true, content: true, updatedAt: true },
        })
      : [];
    const reminders = await prisma.reminder.findMany({
      where: ownedOrCompany(session.user.id, role),
      orderBy: { dueAt: "asc" },
      take: 30,
      select: { id: true, title: true, dueAt: true, isDone: true },
    });
    const canReadTransactions = hasPermission(
      role,
      "transactions:read",
      permissions,
    );
    const transactions = canReadTransactions
      ? await prisma.transaction.findMany({
          where: { userId: session.user.id, scope: "PERSONAL" },
          orderBy: { date: "desc" },
          take: 30,
          select: {
            id: true,
            amount: true,
            description: true,
            type: true,
            date: true,
          },
        })
      : [];
    const canCreateTransactions = hasPermission(
      role,
      "transactions:create",
      permissions,
    );
    const transactionCategories = canCreateTransactions
      ? await prisma.accountCategory.findMany({
          where: {
            scope: "PERSONAL",
            OR: [{ userId: null }, { userId: session.user.id }],
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true, type: true },
        })
      : [];
    const canReadUsers = hasPermission(role, "users:read", permissions);
    const users = canReadUsers
      ? await prisma.user.findMany({
          orderBy: { name: "asc" },
          take: 40,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            title: true,
            lastActiveAt: true,
          },
        })
      : [];
    const documents = await prisma.document.findMany({
      where:
        role === "ADMIN"
          ? {}
          : role === "CLIENT"
            ? { clientId: session.user.id }
            : { createdById: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, status: true, updatedAt: true },
    });
    const clientProjects = await prisma.clientProject.findMany({
      where:
        role === "ADMIN"
          ? {}
          : role === "CLIENT"
            ? { clientId: session.user.id }
            : { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        updatedAt: true,
      },
    });
    const messages = await prisma.message.findMany({
      where: {
        conversation: { participants: { some: { userId: session.user.id } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { name: true } },
        conversation: {
          select: {
            id: true,
            name: true,
            participants: {
              select: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    const messageParticipants = await prisma.conversationParticipant.findMany({
      where: { userId: session.user.id },
      select: { conversationId: true, lastReadAt: true },
    });
    const unreadMessageCount = messageParticipants.length
      ? await prisma.message.count({
          where: {
            OR: messageParticipants.map((participant) => ({
              conversationId: participant.conversationId,
              senderId: { not: session.user.id },
              ...(participant.lastReadAt
                ? { createdAt: { gt: participant.lastReadAt } }
                : {}),
            })),
          },
        })
      : 0;
    const landingAnalytics = hasPermission(role, "landing:manage", permissions)
      ? await getLandingTrafficStats(prisma)
      : undefined;
    const config = await getAssistantConfig();

    const result = await generateAssistantReply({
      messages: input.data.messages,
      context: {
        canCreateTasks: hasPermission(role, "tasks:create", permissions),
        canCreateEvents: hasPermission(role, "events:create", permissions),
        canCreateNotes: hasPermission(role, "notes:create", permissions),
        canCreateTransactions,
        canCreateUsers: hasPermission(role, "users:create", permissions),
        canUpdateTasks: hasPermission(role, "tasks:update", permissions),
        canUpdateEvents: hasPermission(role, "events:update", permissions),
        canUpdateNotes: hasPermission(role, "notes:update", permissions),
        canUpdateTransactions: hasPermission(
          role,
          "transactions:update",
          permissions,
        ),
        canCreateReminders: Boolean(role),
        contextTruncated,
        tasks,
        events,
        notes,
        transactions,
        transactionCategories,
        users,
        reminders,
        documents,
        clientProjects,
        unreadMessageCount,
        landingAnalytics,
        messages: messages.map((message) => ({
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          senderName: message.sender.name,
          conversationId: message.conversation.id,
          conversationName:
            message.conversation.name ??
            message.conversation.participants
              .filter((participant) => participant.user.id !== session.user.id)
              .map((participant) => participant.user.name ?? "Unnamed user")
              .join(", "),
        })),
      },
      config,
      oidcToken: request.headers.get("x-vercel-oidc-token") ?? undefined,
    });
    const conversation = await saveExchange({
      conversationId: input.data.conversationId,
      userId: session.user.id,
      userMessage: latestUserMessage,
      assistantMessage: result.message,
    });
    if (result.action) {
      await prisma.assistantActivity
        .create({
          data: {
            userId: session.user.id,
            action: result.action.type,
            summary: result.message.slice(0, 240),
            status: "PROPOSED",
            details: result.action as any,
          },
        })
        .catch(() => undefined);
    }
    return NextResponse.json({ ...result, conversationId: conversation.id });
  } catch (error) {
    if (error instanceof AssistantRateLimitError) {
      return NextResponse.json(
        { error: "Too many assistant requests. Please wait a minute." },
        { status: 429 },
      );
    }
    console.error("Assistant chat failed", error);
    return NextResponse.json(
      { error: assistantFailureMessage(error) },
      { status: 503 },
    );
  }
}
