import { describe, expect, it, jest } from '@jest/globals'
import {
  getLandingTrafficStats,
  landingDay,
  landingDayKey,
  recordLandingVisit,
} from '../landing-analytics'

function database({
  summary = null,
  dailyRows = [],
}: {
  summary?: { viewCount: number; lastViewedAt: Date | null } | null
  dailyRows?: { date: Date; viewCount: number }[]
} = {}) {
  const landingContent = {
    findFirst: jest.fn().mockImplementation(() => Promise.resolve(summary)),
    upsert: jest.fn().mockImplementation(() => Promise.resolve({})),
  }
  const landingVisitDaily = {
    findMany: jest.fn().mockImplementation(() => Promise.resolve(dailyRows)),
    upsert: jest.fn().mockImplementation(() => Promise.resolve({})),
  }
  const $transaction = jest
    .fn()
    .mockImplementation((operations: unknown) => Promise.resolve(operations))

  return {
    db: { landingContent, landingVisitDaily, $transaction } as any,
    landingContent,
    landingVisitDaily,
    $transaction,
  }
}

describe('landing analytics service', () => {
  it('normalizes analytics dates to UTC days', () => {
    const date = new Date('2026-08-11T23:59:59.000Z')

    expect(landingDay(date)).toEqual(new Date('2026-08-11T00:00:00.000Z'))
    expect(landingDayKey(date)).toBe('2026-08-11')
  })

  it('records lifetime and daily counters in one transaction', async () => {
    const { db, landingContent, landingVisitDaily, $transaction } = database()
    const viewedAt = new Date('2026-08-11T14:30:00.000Z')

    await recordLandingVisit(db, viewedAt)

    expect($transaction).toHaveBeenCalledTimes(1)
    expect(landingContent.upsert).toHaveBeenCalledWith({
      where: { singleton: true },
      create: { singleton: true, viewCount: 1, lastViewedAt: viewedAt },
      update: { viewCount: { increment: 1 }, lastViewedAt: viewedAt },
    })
    expect(landingVisitDaily.upsert).toHaveBeenCalledWith({
      where: { date: new Date('2026-08-11T00:00:00.000Z') },
      create: {
        date: new Date('2026-08-11T00:00:00.000Z'),
        viewCount: 1,
      },
      update: { viewCount: { increment: 1 } },
    })
  })

  it('builds a gap-free history and comparison totals', async () => {
    const now = new Date('2026-08-11T14:30:00.000Z')
    const lastViewedAt = new Date('2026-08-11T13:00:00.000Z')
    const { db } = database({
      summary: { viewCount: 50, lastViewedAt },
      dailyRows: [
        { date: new Date('2026-08-03T00:00:00.000Z'), viewCount: 4 },
        { date: new Date('2026-08-10T00:00:00.000Z'), viewCount: 3 },
        { date: new Date('2026-08-11T00:00:00.000Z'), viewCount: 5 },
      ],
    })

    const result = await getLandingTrafficStats(db, now)

    expect(result).toMatchObject({
      viewCount: 50,
      lastViewedAt,
      todayViews: 5,
      last7Days: 8,
      previous7Days: 4,
      last30Days: 12,
    })
    expect(result.history).toHaveLength(30)
    expect(result.history[0]?.date).toBe('2026-07-13')
    expect(result.history.at(-1)).toEqual({ date: '2026-08-11', views: 5 })
  })
})
