import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/rbac'
import { assignedOrCompany } from '../../../../lib/record-scope'
import {
  assistantMessageSchema,
  generateAssistantReply,
} from '../../../../server/services/assistant'
import {
  AssistantRateLimitError,
  consumeAssistantRequest,
} from '../../../../server/services/assistant-rate-limit'

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

    const result = await generateAssistantReply({
      messages: input.data.messages,
      context: {
        canCreateTasks: hasPermission(role, 'tasks:create'),
        contextTruncated,
        tasks,
      },
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
    return NextResponse.json(
      { error: 'The assistant is temporarily unavailable.' },
      { status: 503 },
    )
  }
}
