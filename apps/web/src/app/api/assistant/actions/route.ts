import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { hash } from 'bcryptjs'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'
import { avatarConfigToJson, generateAvatarSeed } from '../../../../lib/avatar'
import { hasPermission } from '../../../../lib/rbac'
import { assistantActionSchema } from '../../../../server/services/assistant'

const ACTION_PERMISSIONS = {
  create_task: 'tasks:create',
  create_event: 'events:create',
  create_note: 'notes:create',
  create_transaction: 'transactions:create',
  create_user: 'users:create',
} as const

const TRANSACTION_CATEGORY_TYPES = {
  INCOME: ['INVESTMENT'],
  EXPENSE: ['CREDIT_CARD', 'CASH', 'CHECKING', 'SAVINGS'],
  TRANSFER: ['RECEIVABLE', 'PAYABLE'],
} as const

const DEFAULT_TRANSACTION_CATEGORIES = {
  INCOME: { name: 'Income', type: 'INVESTMENT' },
  EXPENSE: { name: 'Expense', type: 'CASH' },
  TRANSFER: { name: 'Transfer', type: 'RECEIVABLE' },
} as const

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

  const permission = ACTION_PERMISSIONS[action.data.type]
  if (!hasPermission(session.user.role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (action.data.type === 'create_user') {
      const slug =
        action.data.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/^\.|\.$/g, '') || 'user'
      let email = action.data.email.toLowerCase()
      if (!email) {
        email = `${slug}@arko.app`
        for (let suffix = 1; await prisma.user.findUnique({ where: { email } }); suffix++) {
          email = `${slug}${suffix}@arko.app`
        }
      } else if (await prisma.user.findUnique({ where: { email } })) {
        return NextResponse.json(
          { error: 'A user with this email already exists.' },
          { status: 409 },
        )
      }

      const generatedPassword = `${randomBytes(12).toString('base64url')}Aa1!`
      const user = await prisma.user.create({
        data: {
          name: action.data.name,
          email,
          title: action.data.userTitle || null,
          role: action.data.userRole,
          password: await hash(generatedPassword, 12),
        },
        select: { id: true, name: true, email: true, role: true },
      })
      await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: avatarConfigToJson(generateAvatarSeed(user.id)) as any,
        },
      })
      return NextResponse.json({ user, generatedPassword })
    }

    if (action.data.type === 'create_note') {
      const note = await prisma.note.create({
        data: {
          title: action.data.title,
          content: action.data.content,
          userId: session.user.id,
          scope: 'PERSONAL',
        },
        select: { id: true, title: true },
      })
      return NextResponse.json({ note })
    }

    if (action.data.type === 'create_transaction') {
      const allowedTypes = TRANSACTION_CATEGORY_TYPES[action.data.transactionType]
      const category = await prisma.accountCategory.findFirst({
        where: {
          ...(action.data.categoryId ? { id: action.data.categoryId } : {}),
          scope: 'PERSONAL',
          OR: [{ userId: null }, { userId: session.user.id }],
          type: { in: [...allowedTypes] },
        },
        select: { id: true },
      })
      const resolvedCategory =
        category ??
        (await prisma.accountCategory.create({
          data: {
            ...DEFAULT_TRANSACTION_CATEGORIES[action.data.transactionType],
            userId: session.user.id,
            scope: 'PERSONAL',
          },
          select: { id: true },
        }))
      const transaction = await prisma.transaction.create({
        data: {
          amount: action.data.amount,
          description: action.data.description || undefined,
          type: action.data.transactionType,
          date: new Date(`${action.data.date}T00:00:00+08:00`),
          categoryId: resolvedCategory.id,
          userId: session.user.id,
          scope: 'PERSONAL',
        },
        select: { id: true, amount: true, type: true },
      })
      return NextResponse.json({ transaction })
    }

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
    const resource = {
      create_task: 'task',
      create_event: 'event',
      create_note: 'note',
      create_transaction: 'transaction',
      create_user: 'user',
    }[action.data.type]
    return NextResponse.json(
      { error: `The ${resource} could not be created.` },
      { status: 503 },
    )
  }
}
