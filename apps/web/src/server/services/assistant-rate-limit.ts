import { prisma } from '@arko/db'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

export class AssistantRateLimitError extends Error {
  constructor() {
    super('Assistant rate limit exceeded')
    this.name = 'AssistantRateLimitError'
  }
}

export async function consumeAssistantRequest(userId: string, now = new Date()) {
  const windowStart = new Date(
    Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS,
  )

  return prisma.$transaction(async (tx) => {
    await tx.assistantRateLimit.deleteMany({
      where: { userId, windowStart: { lt: windowStart } },
    })

    const usage = await tx.assistantRateLimit.upsert({
      where: { userId_windowStart: { userId, windowStart } },
      create: { userId, windowStart },
      update: { count: { increment: 1 } },
      select: { count: true },
    })

    if (usage.count > MAX_REQUESTS) throw new AssistantRateLimitError()
    return { remaining: MAX_REQUESTS - usage.count }
  })
}
