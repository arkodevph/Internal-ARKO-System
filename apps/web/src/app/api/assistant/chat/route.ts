import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/rbac'
import { assignedOrCompany, ownedOrCompany } from '../../../../lib/record-scope'
import {
  assistantMessageSchema,
  generateAssistantReply,
  isAssistantRequestInScope,
} from '../../../../server/services/assistant'
import {
  AssistantRateLimitError,
  consumeAssistantRequest,
} from '../../../../server/services/assistant-rate-limit'
import { getAssistantConfig } from '../../../../server/services/assistant-config'

export const runtime = 'nodejs'

const requestSchema = z.object({
  messages: z.array(assistantMessageSchema).min(1).max(20),
  conversationId: z.string().cuid().optional(),
})

async function saveExchange({
  conversationId,
  userId,
  userMessage,
  assistantMessage,
}: {
  conversationId?: string
  userId: string
  userMessage: string
  assistantMessage: string
}) {
  const messages = {
    create: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage },
    ],
  }

  if (conversationId) {
    return prisma.assistantConversation.update({
      where: { id: conversationId },
      data: { messages },
      select: { id: true },
    })
  }

  return prisma.assistantConversation.create({
    data: {
      userId,
      title: userMessage.slice(0, 60),
      messages,
    },
    select: { id: true },
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const input = requestSchema.safeParse(await request.json().catch(() => null))
  if (!input.success) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
  }

  const latestUserMessage = [...input.data.messages]
    .reverse()
    .find((message) => message.role === 'user')?.content
  if (!latestUserMessage) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
  }

  if (input.data.conversationId) {
    const conversation = await prisma.assistantConversation.findFirst({
      where: {
        id: input.data.conversationId,
        userId: session.user.id,
      },
      select: { id: true },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
  }

  if (!isAssistantRequestInScope(input.data.messages)) {
    const message =
      'I can only help with the ARKO system and the workspace information available to you.'
    const conversation = await saveExchange({
      conversationId: input.data.conversationId,
      userId: session.user.id,
      userMessage: latestUserMessage,
      assistantMessage: message,
    })
    return NextResponse.json({
      message,
      action: null,
      model: 'scope-guard',
      conversationId: conversation.id,
    })
  }

  const role = session.user.role
  const canReadTasks = hasPermission(role, 'tasks:read')

  try {
    await consumeAssistantRequest(session.user.id)
    const taskRows = canReadTasks
      ? await prisma.task.findMany({
          where: assignedOrCompany(session.user.id, role),
          orderBy: { updatedAt: 'desc' },
          take: 41,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        })
      : []
    const contextTruncated = taskRows.length > 40
    const tasks = taskRows.slice(0, 40)
    const canReadEvents = hasPermission(role, 'events:read')
    const events = canReadEvents
      ? await prisma.event.findMany({
          where: ownedOrCompany(session.user.id, role),
          orderBy: { date: 'asc' },
          take: 30,
          select: {
            id: true,
            title: true,
            date: true,
            startTime: true,
            endTime: true,
          },
        })
      : []
    const canReadNotes = hasPermission(role, 'notes:read')
    const notes = canReadNotes
      ? await prisma.note.findMany({
          where: ownedOrCompany(session.user.id, role),
          orderBy: { updatedAt: 'desc' },
          take: 30,
          select: { id: true, title: true, content: true, updatedAt: true },
        })
      : []
    const reminders = await prisma.reminder.findMany({
      where: ownedOrCompany(session.user.id, role),
      orderBy: { dueAt: 'asc' },
      take: 30,
      select: { id: true, title: true, dueAt: true, isDone: true },
    })
    const canReadTransactions = hasPermission(role, 'transactions:read')
    const transactions = canReadTransactions
      ? await prisma.transaction.findMany({
          where: { userId: session.user.id, scope: 'PERSONAL' },
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            id: true,
            amount: true,
            description: true,
            type: true,
            date: true,
          },
        })
      : []
    const canCreateTransactions = hasPermission(role, 'transactions:create')
    const transactionCategories = canCreateTransactions
      ? await prisma.accountCategory.findMany({
          where: {
            scope: 'PERSONAL',
            OR: [{ userId: null }, { userId: session.user.id }],
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, type: true },
        })
      : []
    const canReadUsers = hasPermission(role, 'users:read')
    const users = canReadUsers
      ? await prisma.user.findMany({
          orderBy: { name: 'asc' },
          take: 40,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            title: true,
          },
        })
      : []
    const documents = await prisma.document.findMany({
      where:
        role === 'ADMIN'
          ? {}
          : role === 'CLIENT'
            ? { clientId: session.user.id }
            : { createdById: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, title: true, status: true, updatedAt: true },
    })
    const clientProjects = await prisma.clientProject.findMany({
      where:
        role === 'ADMIN'
          ? {}
          : role === 'CLIENT'
            ? { clientId: session.user.id }
            : { ownerId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, name: true, status: true, progress: true, updatedAt: true },
    })
    const messages = await prisma.message.findMany({
      where: {
        conversation: { participants: { some: { userId: session.user.id } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { name: true } },
      },
    })
    const messageParticipants = await prisma.conversationParticipant.findMany({
      where: { userId: session.user.id },
      select: { conversationId: true, lastReadAt: true },
    })
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
      : 0
    const config = await getAssistantConfig()

    const result = await generateAssistantReply({
      messages: input.data.messages,
      context: {
        canCreateTasks: hasPermission(role, 'tasks:create'),
        canCreateEvents: hasPermission(role, 'events:create'),
        canCreateNotes: hasPermission(role, 'notes:create'),
        canCreateTransactions,
        canCreateUsers: hasPermission(role, 'users:create'),
        canUpdateTasks: hasPermission(role, 'tasks:update'),
        canUpdateEvents: hasPermission(role, 'events:update'),
        canUpdateNotes: hasPermission(role, 'notes:update'),
        canUpdateTransactions: hasPermission(role, 'transactions:update'),
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
        messages: messages.map((message) => ({
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          senderName: message.sender.name,
        })),
      },
      config,
      oidcToken: request.headers.get('x-vercel-oidc-token') ?? undefined,
    })
    const conversation = await saveExchange({
      conversationId: input.data.conversationId,
      userId: session.user.id,
      userMessage: latestUserMessage,
      assistantMessage: result.message,
    })
    if (result.action) {
      await prisma.assistantActivity.create({
        data: {
          userId: session.user.id,
          action: result.action.type,
          summary: result.message.slice(0, 240),
          status: 'PROPOSED',
          details: result.action as any,
        },
      }).catch(() => undefined)
    }
    return NextResponse.json({ ...result, conversationId: conversation.id })
  } catch (error) {
    if (error instanceof AssistantRateLimitError) {
      return NextResponse.json(
        { error: 'Too many assistant requests. Please wait a minute.' },
        { status: 429 },
      )
    }
    console.error('Assistant chat failed', error)
    return NextResponse.json(
      { error: 'The assistant is temporarily unavailable.' },
      { status: 503 },
    )
  }
}
