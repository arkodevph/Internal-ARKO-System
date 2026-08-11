import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const taskFindMany = jest.fn()
const eventFindMany = jest.fn()
const noteFindMany = jest.fn()
const transactionFindMany = jest.fn()
const categoryFindMany = jest.fn()
const userFindMany = jest.fn()
const conversationFindFirst = jest.fn()
const conversationCreate = jest.fn()
const conversationUpdate = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: {
    task: { findMany: taskFindMany },
    event: { findMany: eventFindMany },
    note: { findMany: noteFindMany },
    transaction: { findMany: transactionFindMany },
    accountCategory: { findMany: categoryFindMany },
    user: { findMany: userFindMany },
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
    conversationFindFirst.mockResolvedValue({ id: 'conversation-1' })
    conversationCreate.mockResolvedValue({ id: 'conversation-1' })
    conversationUpdate.mockResolvedValue({ id: 'conversation-1' })
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
    expect(categoryFindMany).not.toHaveBeenCalled()
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
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
        },
      }),
    )
  })

  it('returns 429 when the durable quota is exhausted', async () => {
    consumeRequestMock.mockRejectedValue(new AssistantRateLimitError())

    const response = await POST(request({ messages: [{ role: 'user', content: 'Help' }] }))

    expect(response.status).toBe(429)
    expect(generateReplyMock).not.toHaveBeenCalled()
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
})
