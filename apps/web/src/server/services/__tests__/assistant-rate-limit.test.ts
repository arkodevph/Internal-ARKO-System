import { describe, expect, it, jest } from '@jest/globals'

const deleteMany = jest.fn()
const upsert = jest.fn()
const transaction = jest.fn(async (callback: (tx: unknown) => unknown) =>
  callback({ assistantRateLimit: { deleteMany, upsert } }),
)

jest.mock('@arko/db', () => ({
  prisma: { $transaction: transaction },
}))

import {
  AssistantRateLimitError,
  consumeAssistantRequest,
} from '../assistant-rate-limit'

describe('assistant durable rate limit', () => {
  it('uses a fixed minute window and reports remaining requests', async () => {
    deleteMany.mockResolvedValue({ count: 2 })
    upsert.mockResolvedValue({ count: 7 })

    await expect(
      consumeAssistantRequest('user-1', new Date('2026-08-11T10:45:32.123Z')),
    ).resolves.toEqual({ remaining: 13 })
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_windowStart: {
            userId: 'user-1',
            windowStart: new Date('2026-08-11T10:45:00.000Z'),
          },
        },
      }),
    )
  })

  it('throws inside the transaction after twenty requests', async () => {
    deleteMany.mockResolvedValue({ count: 0 })
    upsert.mockResolvedValue({ count: 21 })

    await expect(consumeAssistantRequest('user-1')).rejects.toBeInstanceOf(
      AssistantRateLimitError,
    )
  })
})
