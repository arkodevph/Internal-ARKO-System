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

  if (!hasPermission(session.user.role, 'tasks:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const action = assistantActionSchema.safeParse(
    await request.json().catch(() => null),
  )
  if (!action.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
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
    return NextResponse.json(
      { error: 'The task could not be created.' },
      { status: 503 },
    )
  }
}
