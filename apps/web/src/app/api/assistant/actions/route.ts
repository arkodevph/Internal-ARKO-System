import { NextResponse } from 'next/server'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/rbac'
import { assistantActionSchema } from '../../../../server/services/assistant'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const action = assistantActionSchema.safeParse(
    await request.json().catch(() => null),
  )
  if (!action.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const permission =
    action.data.type === 'create_task' ? 'tasks:create' : 'events:create'
  if (!hasPermission(session.user.role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (action.data.type === 'create_event') {
      const date = new Date(`${action.data.date}T00:00:00+08:00`)
      if (Number.isNaN(date.getTime()) || action.data.endTime <= action.data.startTime) {
        return NextResponse.json({ error: 'Invalid event date or time' }, { status: 400 })
      }
      const event = await prisma.event.create({
        data: {
          title: action.data.title,
          description: action.data.description || undefined,
          date,
          startTime: action.data.startTime,
          endTime: action.data.endTime,
          userId: session.user.id,
          scope: 'PERSONAL',
        },
        select: { id: true, title: true, date: true },
      })
      return NextResponse.json({ event })
    }

    const maxPosition = await prisma.task.findFirst({
      where: { assigneeId: session.user.id, scope: 'PERSONAL' },
      orderBy: { position: 'desc' },
      select: { position: true },
    })
    const task = await prisma.task.create({
      data: {
        title: action.data.title,
        description: action.data.description || undefined,
        priority: action.data.priority,
        assigneeId: session.user.id,
        position: (maxPosition?.position ?? -1) + 1,
        scope: 'PERSONAL',
      },
      select: { id: true, title: true },
    })

    return NextResponse.json({ task })
  } catch {
    const resource = action.data.type === 'create_event' ? 'event' : 'task'
    return NextResponse.json(
      { error: `The ${resource} could not be created.` },
      { status: 503 },
    )
  }
}
