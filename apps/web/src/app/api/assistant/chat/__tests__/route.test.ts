import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const taskFindMany = jest.fn()
const eventFindMany = jest.fn()
const noteFindMany = jest.fn()
const transactionFindMany = jest.fn()
const categoryFindMany = jest.fn()
const userFindMany = jest.fn()
const reminderFindMany = jest.fn()
const documentFindMany = jest.fn()
const projectFindMany = jest.fn()
const messageFindMany = jest.fn()
const messageCount = jest.fn()
const participantFindMany = jest.fn()
const activityCreate = jest.fn()
const conversationFindFirst = jest.fn()
const conversationCreate = jest.fn()
const conversationUpdate = jest.fn()
const getLandingTrafficStats = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: {
    task: { findMany: taskFindMany },
    event: { findMany: eventFindMany },
    note: { findMany: noteFindMany },
    transaction: { findMany: transactionFindMany },
    accountCategory: { findMany: categoryFindMany },
    user: { findMany: userFindMany },
    reminder: { findMany: reminderFindMany },
    document: { findMany: documentFindMany },
    clientProject: { findMany: projectFindMany },
    message: { findMany: messageFindMany, count: messageCount },
    conversationParticipant: { findMany: participantFindMany },
    assistantActivity: { create: activityCreate },
    assistantConversation: {
      findFirst: conversationFindFirst,
      create: conversationCreate,
      update: conversationUpdate,
    },
  },
}))
jest.mock('../../../../../lib/auth', () => ({ auth: jest.fn() }))
jest.mock('../../../../../server/services/assistant-rate-limit', () => ({
  AssistantRateLimitError: class AssistantRateLimitError extends Error {},
  consumeAssistantRequest: jest.fn(),
}))
jest.mock('../../../../../server/services/assistant', () => ({
  assistantMessageSchema: jest.requireActual('zod').z.object({
    role: jest.requireActual('zod').z.enum(['user', 'assistant']),
    content: jest.requireActual('zod').z.string().trim().min(1).max(2_000),
  }),
  generateAssistantReply: jest.fn(),
  isAssistantRequestInScope: jest.fn(() => true),
}))
jest.mock('../../../../../server/services/assistant-config', () => ({
  getAssistantConfig: jest.fn(() =>
    Promise.resolve({
      assistantName: 'NEX',
      iconStyle: 'BOT',
      accentColor: '#22C55E',
      greeting: 'Ask NEX about your ARKO workspace.',
      personality: 'Calm and practical.',
      projectId: 'test-project',
      location: 'global',
      model: 'gemini-2.5-flash',
      gcpProjectNumber: '787644651015',
      serviceAccountEmail: 'vertex@test-project.iam.gserviceaccount.com',
      workloadIdentityPoolId: 'vercel',
      workloadIdentityProviderId: 'vercel',
    }),
  ),
}))
jest.mock('../../../../../server/services/landing-analytics', () => ({
  getLandingTrafficStats,
}))

import { auth } from '../../../../../lib/auth'
import {
  generateAssistantReply,
  isAssistantRequestInScope,
} from '../../../../../server/services/assistant'
import {
  AssistantRateLimitError,
  consumeAssistantRequest,
} from '../../../../../server/services/assistant-rate-limit'
import { POST } from '../route'

const authMock = jest.mocked(auth)
const generateReplyMock = jest.mocked(generateAssistantReply)
const consumeRequestMock = jest.mocked(consumeAssistantRequest)
const scopeMock = jest.mocked(isAssistantRequestInScope)

function request(body: unknown) {
  return new NextRequest('http://localhost/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('assistant chat route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)
    consumeRequestMock.mockResolvedValue({ remaining: 19 })
    taskFindMany.mockResolvedValue([])
    eventFindMany.mockResolvedValue([])
    noteFindMany.mockResolvedValue([])
    transactionFindMany.mockResolvedValue([])
    categoryFindMany.mockResolvedValue([])
    userFindMany.mockResolvedValue([])
    reminderFindMany.mockResolvedValue([])
    documentFindMany.mockResolvedValue([])
    projectFindMany.mockResolvedValue([])
    messageFindMany.mockResolvedValue([])
    messageCount.mockResolvedValue(0)
    participantFindMany.mockResolvedValue([])
    activityCreate.mockResolvedValue({ id: 'activity-1' })
    conversationFindFirst.mockResolvedValue({ id: 'conversation-1' })
    conversationCreate.mockResolvedValue({ id: 'conversation-1' })
    conversationUpdate.mockResolvedValue({ id: 'conversation-1' })
    getLandingTrafficStats.mockResolvedValue({
      viewCount: 120,
      lastViewedAt: new Date('2026-08-12T04:00:00Z'),
      todayViews: 8,
      last7Days: 45,
      previous7Days: 30,
      last30Days: 120,
      history: [],
    })
    generateReplyMock.mockResolvedValue({
      message: 'Ready.',
      action: null,
      model: 'gemini-2.5-flash',
    })
    scopeMock.mockReturnValue(true)
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)

    const response = await POST(request({ messages: [{ role: 'user', content: 'Hi' }] }))

    expect(response.status).toBe(401)
    expect(consumeRequestMock).not.toHaveBeenCalled()
  })

  it('rejects malformed messages before consuming quota', async () => {
    const response = await POST(request({ messages: [] }))

    expect(response.status).toBe(400)
    expect(consumeRequestMock).not.toHaveBeenCalled()
  })

  it('refuses outside requests before querying data or using Vertex quota', async () => {
    scopeMock.mockReturnValue(false)

    const response = await POST(
      request({ messages: [{ role: 'user', content: 'Who won the game?' }] }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ model: 'scope-guard' })
    expect(consumeRequestMock).not.toHaveBeenCalled()
    expect(taskFindMany).not.toHaveBeenCalled()
    expect(eventFindMany).not.toHaveBeenCalled()
    expect(noteFindMany).not.toHaveBeenCalled()
    expect(transactionFindMany).not.toHaveBeenCalled()
    expect(generateReplyMock).not.toHaveBeenCalled()
    expect(conversationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' }),
      }),
    )
  })

  it('does not expose task context to roles without tasks:read', async () => {
    authMock.mockResolvedValue({ user: { id: 'client-1', role: 'CLIENT' } } as any)

    const response = await POST(request({ messages: [{ role: 'user', content: 'Help' }] }))

    expect(response.status).toBe(200)
    expect(taskFindMany).not.toHaveBeenCalled()
    expect(eventFindMany).not.toHaveBeenCalled()
    expect(noteFindMany).not.toHaveBeenCalled()
    expect(transactionFindMany).not.toHaveBeenCalled()
    expect(getLandingTrafficStats).not.toHaveBeenCalled()
    expect(categoryFindMany).not.toHaveBeenCalled()
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          canCreateTasks: false,
          canCreateEvents: false,
          canCreateNotes: false,
          canCreateTransactions: false,
          canCreateUsers: false,
          contextTruncated: false,
          tasks: [],
          events: [],
          notes: [],
          transactions: [],
          transactionCategories: [],
          users: [],
        }),
      }),
    )
  })

  it('supplies aggregate landing analytics to admins', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any)

    await POST(request({
      messages: [{ role: 'user', content: 'Summarize landing page analytics' }],
    }))

    expect(getLandingTrafficStats).toHaveBeenCalledTimes(1)
    expect(generateReplyMock).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        landingAnalytics: expect.objectContaining({
          viewCount: 120,
          todayViews: 8,
          last7Days: 45,
          previous7Days: 30,
        }),
      }),
    }))
  })

  it('returns 429 when the durable quota is exhausted', async () => {
    consumeRequestMock.mockRejectedValue(new AssistantRateLimitError())

    const response = await POST(request({ messages: [{ role: 'user', content: 'Help' }] }))

    expect(response.status).toBe(429)
    expect(generateReplyMock).not.toHaveBeenCalled()
  })

  it.each([
    [
      new Error('GOOGLE_CLOUD_PROJECT is not configured'),
      'NEX is not fully configured for this deployment.',
    ],
    [
      Object.assign(new Error('Permission denied'), { status: 403 }),
      'NEX could not authenticate with Vertex AI.',
    ],
    [
      Object.assign(new Error('Resource exhausted'), {
        code: 'RESOURCE_EXHAUSTED',
      }),
      'Vertex AI has reached its usage limit.',
    ],
    [
      new SyntaxError('Unexpected token'),
      'NEX received a response it could not safely process.',
    ],
  ])('explains assistant service failures without exposing raw errors', async (error, explanation) => {
    generateReplyMock.mockRejectedValueOnce(error)

    const response = await POST(
      request({ messages: [{ role: 'user', content: 'Create an expense' }] }),
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: expect.stringContaining(explanation),
    })
  })

  it('loads permitted task context and returns the model response', async () => {
    taskFindMany.mockResolvedValue([{ id: 'task-1', title: 'Ship', status: 'TODO' }])

    const response = await POST(request({ messages: [{ role: 'user', content: 'What is next?' }] }))

    expect(response.status).toBe(200)
    expect(taskFindMany).toHaveBeenCalledTimes(1)
    expect(eventFindMany).toHaveBeenCalledTimes(1)
    expect(noteFindMany).toHaveBeenCalledTimes(1)
    expect(transactionFindMany).toHaveBeenCalledTimes(1)
    expect(categoryFindMany).toHaveBeenCalledTimes(1)
    expect(userFindMany).toHaveBeenCalledTimes(1)
    expect(await response.json()).toMatchObject({ message: 'Ready.' })
    expect(conversationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'What is next?',
          messages: {
            create: [
              { role: 'user', content: 'What is next?' },
              { role: 'assistant', content: 'Ready.' },
            ],
          },
        }),
      }),
    )
  })

  it('continues only a conversation owned by the signed-in user', async () => {
    const response = await POST(
      request({
        conversationId: 'cm12345678901234567890123',
        messages: [{ role: 'user', content: 'Continue' }],
      }),
    )

    expect(response.status).toBe(200)
    expect(conversationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cm12345678901234567890123', userId: 'user-1' },
      }),
    )
    expect(conversationUpdate).toHaveBeenCalled()
  })

  it('rejects a conversation owned by another user', async () => {
    conversationFindFirst.mockResolvedValue(null)

    const response = await POST(
      request({
        conversationId: 'cm12345678901234567890123',
        messages: [{ role: 'user', content: 'Continue' }],
      }),
    )

    expect(response.status).toBe(404)
    expect(generateReplyMock).not.toHaveBeenCalled()
    expect(conversationUpdate).not.toHaveBeenCalled()
  })

  it('marks task context when more records are available', async () => {
    taskFindMany.mockResolvedValue(
      Array.from({ length: 41 }, (_, index) => ({
        id: `task-${index}`,
        title: `Task ${index}`,
        status: 'TODO',
      })),
    )

    await POST(request({ messages: [{ role: 'user', content: 'Summarize' }] }))

    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          contextTruncated: true,
          tasks: expect.any(Array),
        }),
      }),
    )
    const context = generateReplyMock.mock.calls[0]?.[0].context
    expect(context.tasks).toHaveLength(40)
  })

  it('supplies the exact unread message count for daily briefings', async () => {
    participantFindMany.mockResolvedValue([{
      conversationId: 'conversation-1',
      lastReadAt: new Date('2026-08-11T08:00:00Z'),
    }])
    messageCount.mockResolvedValue(3)

    await POST(request({ messages: [{ role: 'user', content: 'Give me my daily briefing' }] }))

    expect(messageCount).toHaveBeenCalledWith({
      where: {
        OR: [{
          conversationId: 'conversation-1',
          senderId: { not: 'user-1' },
          createdAt: { gt: new Date('2026-08-11T08:00:00Z') },
        }],
      },
    })
    expect(generateReplyMock).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ unreadMessageCount: 3 }),
    }))
  })

  it('supplies presence and conversation-aware messages for authorized workspace questions', async () => {
    const lastActiveAt = new Date('2026-08-12T14:00:00Z')
    userFindMany.mockResolvedValue([{
      id: 'user-2',
      name: 'Alex',
      email: 'alex@arko.app',
      role: 'MEMBER',
      status: 'ACTIVE',
      title: 'Designer',
      lastActiveAt,
    }])
    messageFindMany.mockResolvedValue([{
      id: 'message-1',
      content: 'The homepage review is ready.',
      createdAt: new Date('2026-08-12T13:55:00Z'),
      sender: { name: 'Alex' },
      conversation: {
        id: 'conversation-1',
        name: null,
        participants: [
          { user: { id: 'user-1', name: 'Justine' } },
          { user: { id: 'user-2', name: 'Alex' } },
        ],
      },
    }])

    await POST(request({ messages: [{ role: 'user', content: 'Who is online and what are my messages?' }] }))

    expect(userFindMany).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ lastActiveAt: true }),
    }))
    expect(generateReplyMock).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        users: [expect.objectContaining({ name: 'Alex', lastActiveAt })],
        messages: [expect.objectContaining({
          senderName: 'Alex',
          conversationId: 'conversation-1',
          conversationName: 'Alex',
        })],
      }),
    }))
  })
})
