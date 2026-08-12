import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const findMany = jest.fn()
const findFirst = jest.fn()
const deleteMany = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: {
    assistantConversation: { findMany, findFirst, deleteMany },
  },
}))
jest.mock('../../../../../lib/auth', () => ({ auth: jest.fn() }))

import { auth } from '../../../../../lib/auth'
import { DELETE, GET } from '../route'

const authMock = jest.mocked(auth)
const conversationId = 'cm12345678901234567890123'

describe('assistant history route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } } as any)
    findMany.mockResolvedValue([])
    findFirst.mockResolvedValue({ id: conversationId, title: 'Plan work', messages: [] })
    deleteMany.mockResolvedValue({ count: 1 })
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/assistant/history'))
    expect(response.status).toBe(401)
  })

  it('lists only the signed-in user conversations', async () => {
    const response = await GET(new NextRequest('http://localhost/api/assistant/history'))

    expect(response.status).toBe(200)
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' }, take: 40 }),
    )
  })

  it('loads a conversation using owner scoping', async () => {
    const response = await GET(
      new NextRequest(
        `http://localhost/api/assistant/history?conversationId=${conversationId}`,
      ),
    )

    expect(response.status).toBe(200)
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: conversationId, userId: 'user-1' },
      }),
    )
  })

  it('does not reveal another user conversation', async () => {
    findFirst.mockResolvedValue(null)
    const response = await GET(
      new NextRequest(
        `http://localhost/api/assistant/history?conversationId=${conversationId}`,
      ),
    )
    expect(response.status).toBe(404)
  })

  it('deletes only a conversation owned by the signed-in user', async () => {
    const response = await DELETE(
      new NextRequest(
        `http://localhost/api/assistant/history?conversationId=${conversationId}`,
      ),
    )

    expect(response.status).toBe(200)
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: conversationId, userId: 'user-1' },
    })
  })
})
