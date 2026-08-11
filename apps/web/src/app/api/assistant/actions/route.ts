import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { hash } from 'bcryptjs'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'
import { avatarConfigToJson, generateAvatarSeed } from '../../../../lib/avatar'
import { hasPermission } from '../../../../lib/rbac'
import { canManageOwnedRecord } from '../../../../lib/record-scope'
import { assistantActionSchema } from '../../../../server/services/assistant'

const ACTION_PERMISSIONS = {
  create_task: 'tasks:create',
  create_event: 'events:create',
  create_note: 'notes:create',
  create_transaction: 'transactions:create',
  create_user: 'users:create',
  send_message: null,
  complete_task: 'tasks:update',
  reschedule_event: 'events:update',
  update_note: 'notes:update',
  update_transaction: 'transactions:update',
  create_reminder: null,
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
  if (permission && !hasPermission(session.user.role, permission)) {
    await prisma.assistantActivity.create({
      data: {
        userId: session.user.id,
        action: action.data.type,
        summary: 'Action rejected by role permissions.',
        status: 'REJECTED',
        details: action.data as any,
      },
    }).catch(() => undefined)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const success = async (payload: object, summary: string) => {
    await prisma.assistantActivity.create({
      data: {
        userId: session.user.id,
        action: action.data.type,
        summary,
        status: 'COMPLETED',
        details: action.data as any,
      },
    }).catch(() => undefined)
    return NextResponse.json(payload)
  }
  const rejected = async (error: string, status: number) => {
    await prisma.assistantActivity.create({
      data: {
        userId: session.user.id,
        action: action.data.type,
        summary: error,
        status: 'REJECTED',
        details: action.data as any,
      },
    }).catch(() => undefined)
    return NextResponse.json({ error }, { status })
  }

  try {
    if (action.data.type === 'complete_task') {
      const task = await prisma.task.findUnique({
        where: { id: action.data.recordId },
        select: {
          id: true,
          title: true,
          assigneeId: true,
          blockedBy: { select: { blocking: { select: { status: true } } } },
        },
      })
      if (
        !task ||
        (task.assigneeId &&
          task.assigneeId !== session.user.id &&
          session.user.role !== 'ADMIN')
      ) {
        return rejected('Task not found.', 404)
      }
      if (task.blockedBy.some((item) => item.blocking.status !== 'DONE')) {
        return rejected('Complete the blocking tasks first.', 409)
      }
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'DONE' },
        select: { id: true, title: true, status: true },
      })
      return success({ task: updatedTask }, `Completed task “${task.title}”.`)
    }

    if (action.data.type === 'reschedule_event') {
      const event = await prisma.event.findUnique({ where: { id: action.data.recordId } })
      if (!event || !canManageOwnedRecord(event.userId, session.user.id, session.user.role)) {
        return rejected('Event not found.', 404)
      }
      if (action.data.endTime <= action.data.startTime) {
        return rejected('Invalid event time range.', 400)
      }
      const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: {
          date: new Date(`${action.data.date}T00:00:00+08:00`),
          startTime: action.data.startTime,
          endTime: action.data.endTime,
        },
        select: { id: true, title: true, date: true, startTime: true, endTime: true },
      })
      return success({ event: updatedEvent }, `Rescheduled event “${event.title}”.`)
    }

    if (action.data.type === 'update_note') {
      const note = await prisma.note.findUnique({ where: { id: action.data.recordId } })
      if (!note || !canManageOwnedRecord(note.userId, session.user.id, session.user.role)) {
        return rejected('Note not found.', 404)
      }
      const updatedNote = await prisma.note.update({
        where: { id: note.id },
        data: { title: action.data.title, content: action.data.content },
        select: { id: true, title: true },
      })
      return success({ note: updatedNote }, `Updated note “${updatedNote.title}”.`)
    }

    if (action.data.type === 'update_transaction') {
      const existingTransaction = await prisma.transaction.findFirst({
        where: { id: action.data.recordId, userId: session.user.id, scope: 'PERSONAL' },
      })
      if (!existingTransaction) {
        return rejected('Finance entry not found.', 404)
      }
      const allowedTypes = TRANSACTION_CATEGORY_TYPES[action.data.transactionType]
      const category = await prisma.accountCategory.findFirst({
        where: {
          id: action.data.categoryId,
          scope: 'PERSONAL',
          OR: [{ userId: null }, { userId: session.user.id }],
          type: { in: [...allowedTypes] },
        },
        select: { id: true },
      })
      if (!category) return rejected('Invalid finance category.', 400)
      const updatedTransaction = await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          amount: action.data.amount,
          description: action.data.description || null,
          type: action.data.transactionType,
          categoryId: category.id,
          date: new Date(`${action.data.date}T00:00:00+08:00`),
        },
        select: { id: true, amount: true, type: true },
      })
      return success({ transaction: updatedTransaction }, 'Updated a personal finance entry.')
    }

    if (action.data.type === 'create_reminder') {
      const reminder = await prisma.reminder.create({
        data: {
          title: action.data.title,
          note: action.data.note || null,
          dueAt: new Date(action.data.dueAt),
          recurrence: action.data.recurrence,
          notifyMinutesBefore: action.data.notifyMinutesBefore,
          userId: session.user.id,
          scope: 'PERSONAL',
        },
        select: { id: true, title: true, dueAt: true, recurrence: true },
      })
      return success({ reminder }, `Created reminder “${reminder.title}”.`)
    }

    if (action.data.type === 'send_message') {
      const recipient = await prisma.user.findFirst({
        where: {
          id: action.data.recipientId,
          status: 'ACTIVE',
          NOT: { id: session.user.id },
        },
        select: { id: true, name: true, email: true },
      })
      if (!recipient) {
        return rejected('The recipient is unavailable.', 404)
      }

      const participantIds = [session.user.id, recipient.id]
      const dmKey = [...participantIds].sort().join(':')
      const existing = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: session.user.id } } },
            { participants: { some: { userId: recipient.id } } },
            { participants: { none: { userId: { notIn: participantIds } } } },
          ],
        },
        select: { id: true, dmKey: true },
      })
      const conversation =
        existing ??
        (await prisma.conversation.upsert({
          where: { dmKey },
          update: {},
          create: {
            dmKey,
            participants: {
              createMany: { data: participantIds.map((userId) => ({ userId })) },
            },
          },
          select: { id: true, dmKey: true },
        }))
      if (existing && !existing.dmKey) {
        await prisma.conversation.update({
          where: { id: existing.id },
          data: { dmKey },
        }).catch(() => undefined)
      }

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: session.user.id,
            content: action.data.messageContent,
          },
          select: { id: true, content: true, conversationId: true },
        }),
        prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        }),
      ])
      return success({ message, recipient }, `Sent an internal message to ${recipient.name ?? recipient.email}.`)
    }

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
        return rejected('A user with this email already exists.', 409)
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
      return success({ user, generatedPassword }, `Created user “${user.name ?? user.email}”.`)
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
      return success({ note }, `Created note “${note.title}”.`)
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
      return success({ transaction }, 'Created a personal finance entry.')
    }

    if (action.data.type === 'create_event') {
      const date = new Date(`${action.data.date}T00:00:00+08:00`)
      if (Number.isNaN(date.getTime()) || action.data.endTime <= action.data.startTime) {
        return rejected('Invalid event date or time.', 400)
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
      return success({ event }, `Created event “${event.title}”.`)
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

    return success({ task }, `Created task “${task.title}”.`)
  } catch {
    const resource = {
      create_task: 'task',
      create_event: 'event',
      create_note: 'note',
      create_transaction: 'transaction',
      create_user: 'user',
      send_message: 'message',
      complete_task: 'task',
      reschedule_event: 'event',
      update_note: 'note',
      update_transaction: 'transaction',
      create_reminder: 'reminder',
    }[action.data.type]
    const operation = {
      complete_task: 'completed',
      reschedule_event: 'rescheduled',
      update_note: 'updated',
      update_transaction: 'updated',
      send_message: 'sent',
    }[action.data.type as 'complete_task' | 'reschedule_event' | 'update_note' | 'update_transaction' | 'send_message'] ?? 'created'
    await prisma.assistantActivity.create({
      data: {
        userId: session.user.id,
        action: action.data.type,
        summary: `The ${resource} action failed.`,
        status: 'FAILED',
        details: action.data as any,
      },
    }).catch(() => undefined)
    return NextResponse.json(
      { error: `The ${resource} could not be ${operation}.` },
      { status: 503 },
    )
  }
}
