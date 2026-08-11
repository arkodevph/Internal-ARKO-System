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
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const input = requestSchema.safeParse(await request.json().catch(() => null))
  if (!input.success) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
  }

  if (!isAssistantRequestInScope(input.data.messages)) {
    return NextResponse.json({
      message:
        'I can only help with the ARKO system and the workspace information available to you.',
      action: null,
      model: 'scope-guard',
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
    const config = await getAssistantConfig()

    const result = await generateAssistantReply({
      messages: input.data.messages,
      context: {
        canCreateTasks: hasPermission(role, 'tasks:create'),
        canCreateEvents: hasPermission(role, 'events:create'),
        contextTruncated,
        tasks,
        events,
      },
      config,
      oidcToken: request.headers.get('x-vercel-oidc-token') ?? undefined,
    })
    return NextResponse.json(result)
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
