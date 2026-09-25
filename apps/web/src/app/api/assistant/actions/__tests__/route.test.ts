import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const findFirst = jest.fn()
const findTask = jest.fn()
const createTask = jest.fn()
const createEvent = jest.fn()
const createNote = jest.fn()
const createTransaction = jest.fn()
const findCategory = jest.fn()
const createCategory = jest.fn()
const findUser = jest.fn()
const createUser = jest.fn()
const updateUser = jest.fn()
const findRecipient = jest.fn()
const findConversation = jest.fn()
const upsertConversation = jest.fn()
const updateConversation = jest.fn()
const createMessage = jest.fn()
const transaction = jest.fn((operations: Array<Promise<unknown>>) =>
  Promise.all(operations),
)
const updateTask = jest.fn()
const findEvent = jest.fn()
const updateEvent = jest.fn()
const findNote = jest.fn()
const updateNote = jest.fn()
const findTransaction = jest.fn()
const updateTransaction = jest.fn()
const createReminder = jest.fn()
const createActivity = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: {
    task: { findFirst, findUnique: findTask, create: createTask, update: updateTask },
    event: { findUnique: findEvent, create: createEvent, update: updateEvent },
    note: { findUnique: findNote, create: createNote, update: updateNote },
    transaction: { findFirst: findTransaction, create: createTransaction, update: updateTransaction },
    accountCategory: { findFirst: findCategory, create: createCategory },
    user: {
      findUnique: findUser,
      findFirst: findRecipient,
      create: createUser,
      update: updateUser,
    },
    conversation: {
      findFirst: findConversation,
      upsert: upsertConversation,
      update: updateConversation,
    },
    message: { create: createMessage },
    reminder: { create: createReminder },
    assistantActivity: { create: createActivity },
    $transaction: transaction,
  },
}))
jest.mock('../../../../../lib/auth', () => ({ auth: jest.fn() }))
jest.mock('bcryptjs', () => ({ hash: jest.fn(() => Promise.resolve('hashed')) }))

import { auth } from '../../../../../lib/auth'
import { POST } from '../route'

const authMock = jest.mocked(auth)

function request(body: unknown) {
  return new NextRequest('http://localhost/api/assistant/actions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const validAction = {
  type: 'create_task',
  title: 'Prepare proposal',
  description: 'Draft the first version',
  priority: 'HIGH',
}

const validEventAction = {
  type: 'create_event',
  title: 'Project meeting',
  description: 'Review delivery plan',
  date: '2026-08-12',
  startTime: '13:00',
  endTime: '14:00',
}

const validNoteAction = {
  type: 'create_note',
  title: 'Client outreach',
  content: 'Send a cold text to clients through WhatsApp',
}

const validTransactionAction = {
  type: 'create_transaction',
  description: 'Income',
  amount: 1000,
  transactionType: 'INCOME',
  categoryId: 'income-category',
  date: '2026-08-11',
}

const validUserAction = {
  type: 'create_user',
  name: 'Maria Santos',
  email: 'maria@example.com',
  userRole: 'MEMBER',
  userTitle: 'Designer',
}

const validMessageAction = {
  type: 'send_message',
  recipientId: 'user-maria',
  recipientName: 'Maria Santos',
  messageContent: 'Please review the landing page today.',
}

const validReminderAction = {
  type: 'create_reminder',
  title: 'Review proposal',
  note: 'Before the client call',
  dueAt: '2026-08-12T09:00:00+08:00',
  recurrence: 'WEEKLY',
  notifyMinutesBefore: 15,
}

describe('assistant action route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)
    findFirst.mockResolvedValue({ position: 3 })
    findTask.mockResolvedValue(null)
    createTask.mockResolvedValue({ id: 'task-1', title: validAction.title })
    createEvent.mockResolvedValue({
      id: 'event-1',
      title: validEventAction.title,
      date: new Date('2026-08-12T00:00:00+08:00'),
    })
    createNote.mockResolvedValue({ id: 'note-1', title: validNoteAction.title })
    findCategory.mockResolvedValue({ id: 'income-category' })
    createCategory.mockResolvedValue({ id: 'new-income-category' })
    createTransaction.mockResolvedValue({
      id: 'transaction-1',
      amount: 1000,
      type: 'INCOME',
    })
    findUser.mockResolvedValue(null)
    createUser.mockResolvedValue({
      id: 'new-user-1',
      name: validUserAction.name,
      email: validUserAction.email,
      role: validUserAction.userRole,
    })
    updateUser.mockResolvedValue({ id: 'new-user-1' })
    findRecipient.mockResolvedValue({
      id: 'user-maria',
      name: 'Maria Santos',
      email: 'maria@example.com',
    })
    findConversation.mockResolvedValue({ id: 'conversation-1', dmKey: 'user-1:user-maria' })
    upsertConversation.mockResolvedValue({
      id: 'conversation-1',
      dmKey: 'user-1:user-maria',
    })
    updateConversation.mockResolvedValue({ id: 'conversation-1' })
    createMessage.mockResolvedValue({
      id: 'message-1',
      content: validMessageAction.messageContent,
      conversationId: 'conversation-1',
    })
    createActivity.mockResolvedValue({ id: 'activity-1' })
    createReminder.mockResolvedValue({
      id: 'reminder-1',
      title: validReminderAction.title,
      dueAt: new Date(validReminderAction.dueAt),
      recurrence: 'WEEKLY',
    })
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)
    expect((await POST(request(validAction))).status).toBe(401)
  })

  it('enforces tasks:create permission', async () => {
    authMock.mockResolvedValue({ user: { id: 'client-1', role: 'CLIENT' } } as any)
    expect((await POST(request(validAction))).status).toBe(403)
    expect(createTask).not.toHaveBeenCalled()
  })

  it('validates proposed actions', async () => {
    expect((await POST(request({ ...validAction, title: '' }))).status).toBe(400)
    expect(createTask).not.toHaveBeenCalled()
  })

  it('creates a personal task assigned to the confirming user', async () => {
    const response = await POST(request(validAction))

    expect(response.status).toBe(200)
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assigneeId: 'user-1',
          position: 4,
          scope: 'PERSONAL',
        }),
      }),
    )
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assigneeId: 'user-1', scope: 'PERSONAL' },
      }),
    )
  })

  it('returns a stable JSON error when task creation fails', async () => {
    createTask.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(request(validAction))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'The task could not be created.',
    })
  })

  it('creates a personal event owned by the confirming user', async () => {
    const response = await POST(request(validEventAction))

    expect(response.status).toBe(200)
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          scope: 'PERSONAL',
          startTime: '13:00',
          endTime: '14:00',
        }),
      }),
    )
  })

  it('enforces events:create permission independently from task access', async () => {
    authMock.mockResolvedValue({
      user: { id: 'accountant-1', role: 'ACCOUNTANT' },
    } as any)

    expect((await POST(request(validEventAction))).status).toBe(403)
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('rejects invalid calendar dates and time ranges', async () => {
    expect(
      (await POST(request({ ...validEventAction, date: '2026-02-31' }))).status,
    ).toBe(400)
    expect(
      (
        await POST(
          request({
            ...validEventAction,
            startTime: '14:00',
            endTime: '13:00',
          }),
        )
      ).status,
    ).toBe(400)
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('creates a personal note without performing outside actions', async () => {
    const response = await POST(request(validNoteAction))

    expect(response.status).toBe(200)
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          scope: 'PERSONAL',
          content: validNoteAction.content,
        }),
      }),
    )
  })

  it('creates a personal finance entry with an accessible category', async () => {
    const response = await POST(request(validTransactionAction))

    expect(response.status).toBe(200)
    expect(findCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'income-category',
          scope: 'PERSONAL',
        }),
      }),
    )
    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: 1000,
          type: 'INCOME',
          scope: 'PERSONAL',
        }),
      }),
    )
  })

  it('creates a personal fallback category when no compatible one exists', async () => {
    findCategory.mockResolvedValue(null)

    const response = await POST(request(validTransactionAction))

    expect(response.status).toBe(200)
    expect(createCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Income',
          type: 'INVESTMENT',
          userId: 'user-1',
          scope: 'PERSONAL',
        }),
      }),
    )
    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: 'new-income-category' }),
      }),
    )
  })

  it('allows an admin to create a user after confirmation', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any)

    const response = await POST(request(validUserAction))

    expect(response.status).toBe(200)
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Maria Santos',
          email: 'maria@example.com',
          role: 'MEMBER',
          password: 'hashed',
        }),
      }),
    )
    expect(updateUser).toHaveBeenCalled()
    expect(await response.json()).toMatchObject({
      user: { email: 'maria@example.com' },
      generatedPassword: expect.any(String),
    })
  })

  it('prevents non-admin roles from creating users', async () => {
    const response = await POST(request(validUserAction))

    expect(response.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })

  it('sends a confirmed internal message to an active user', async () => {
    authMock.mockResolvedValue({ user: { id: 'member-1', role: 'MEMBER' } } as any)
    const response = await POST(request(validMessageAction))

    expect(response.status).toBe(200)
    expect(findRecipient).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'user-maria',
          status: 'ACTIVE',
        }),
      }),
    )
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          conversationId: 'conversation-1',
          senderId: 'member-1',
          content: validMessageAction.messageContent,
        },
      }),
    )
    expect(await response.json()).toMatchObject({
      recipient: { id: 'user-maria' },
      message: { id: 'message-1' },
    })
  })

  it('does not let a bare USER send a NEX message', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)

    const response = await POST(request(validMessageAction))

    expect(response.status).toBe(403)
    expect(findRecipient).not.toHaveBeenCalled()
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('rejects unavailable message recipients', async () => {
    authMock.mockResolvedValue({ user: { id: 'member-1', role: 'MEMBER' } } as any)
    findRecipient.mockResolvedValue(null)

    const response = await POST(request(validMessageAction))

    expect(response.status).toBe(404)
    expect(createMessage).not.toHaveBeenCalled()
  })

  it('creates a recurring reminder with notification lead time', async () => {
    authMock.mockResolvedValue({ user: { id: 'member-1', role: 'MEMBER' } } as any)
    const response = await POST(request(validReminderAction))

    expect(response.status).toBe(200)
    expect(createReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'member-1',
          recurrence: 'WEEKLY',
          notifyMinutesBefore: 15,
        }),
      }),
    )
    expect(createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    )
  })

  it('does not let a bare USER create a reminder through NEX', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)

    const response = await POST(request(validReminderAction))

    expect(response.status).toBe(403)
    expect(createReminder).not.toHaveBeenCalled()
  })

  it('completes an accessible task only after confirmation', async () => {
    findTask.mockResolvedValue({ id: 'task-1', title: 'Prepare proposal', assigneeId: 'user-1', blockedBy: [] })
    updateTask.mockResolvedValue({ id: 'task-1', title: 'Prepare proposal', status: 'DONE' })

    const response = await POST(request({
      type: 'complete_task',
      recordId: 'task-1',
      title: 'Prepare proposal',
    }))

    expect(response.status).toBe(200)
    expect(updateTask).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'task-1' },
      data: { status: 'DONE' },
    }))
  })

  it('does not complete a task with unfinished blockers', async () => {
    findTask.mockResolvedValue({
      id: 'task-1',
      title: 'Prepare proposal',
      assigneeId: 'user-1',
      blockedBy: [{ blocking: { status: 'IN_PROGRESS' } }],
    })

    const response = await POST(request({
      type: 'complete_task',
      recordId: 'task-1',
      title: 'Prepare proposal',
    }))

    expect(response.status).toBe(409)
    expect(updateTask).not.toHaveBeenCalled()
  })

  it('does not let a non-admin complete another user\'s task', async () => {
    findTask.mockResolvedValue({
      id: 'task-1',
      title: 'Prepare proposal',
      assigneeId: 'user-2',
      blockedBy: [],
    })

    const response = await POST(request({
      type: 'complete_task',
      recordId: 'task-1',
      title: 'Prepare proposal',
    }))

    expect(response.status).toBe(404)
    expect(updateTask).not.toHaveBeenCalled()
  })
})
