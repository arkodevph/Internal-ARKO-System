import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const findMany = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: { task: { findMany } },
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
}))

import { auth } from '../../../../../lib/auth'
import { generateAssistantReply } from '../../../../../server/services/assistant'
import {
  AssistantRateLimitError,
  consumeAssistantRequest,
} from '../../../../../server/services/assistant-rate-limit'
import { POST } from '../route'

const authMock = jest.mocked(auth)
const generateReplyMock = jest.mocked(generateAssistantReply)
const consumeRequestMock = jest.mocked(consumeAssistantRequest)

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
    findMany.mockResolvedValue([])
    generateReplyMock.mockResolvedValue({
      message: 'Ready.',
      action: null,
      model: 'gemini-2.5-flash',
    })
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

  it('does not expose task context to roles without tasks:read', async () => {
    authMock.mockResolvedValue({ user: { id: 'client-1', role: 'CLIENT' } } as any)

    const response = await POST(request({ messages: [{ role: 'user', content: 'Help' }] }))

    expect(response.status).toBe(200)
    expect(findMany).not.toHaveBeenCalled()
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          canCreateTasks: false,
          contextTruncated: false,
          tasks: [],
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
    findMany.mockResolvedValue([{ id: 'task-1', title: 'Ship', status: 'TODO' }])

    const response = await POST(request({ messages: [{ role: 'user', content: 'What is next?' }] }))

    expect(response.status).toBe(200)
    expect(findMany).toHaveBeenCalledTimes(1)
    expect(await response.json()).toMatchObject({ message: 'Ready.' })
  })

  it('marks task context when more records are available', async () => {
    findMany.mockResolvedValue(
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
