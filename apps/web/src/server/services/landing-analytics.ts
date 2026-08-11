import type { PrismaClient } from '@prisma/client'

const HISTORY_DAYS = 30
const COMPARISON_DAYS = 7

type LandingAnalyticsDatabase = Pick<
  PrismaClient,
  'landingContent' | 'landingVisitDaily' | '$transaction'
>

export function landingDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

export function landingDayKey(date: Date) {
  return landingDay(date).toISOString().slice(0, 10)
}

export async function recordLandingVisit(
  db: LandingAnalyticsDatabase,
  viewedAt = new Date(),
) {
  const day = landingDay(viewedAt)

  await db.$transaction([
    db.landingContent.upsert({
      where: { singleton: true },
      create: { singleton: true, viewCount: 1, lastViewedAt: viewedAt },
      update: { viewCount: { increment: 1 }, lastViewedAt: viewedAt },
    }),
    db.landingVisitDaily.upsert({
      where: { date: day },
      create: { date: day, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    }),
  ])
}

export async function getLandingTrafficStats(
  db: LandingAnalyticsDatabase,
  now = new Date(),
) {
  const today = landingDay(now)
  const historyStart = new Date(today)
  historyStart.setUTCDate(historyStart.getUTCDate() - (HISTORY_DAYS - 1))

  const [summary, dailyRows] = await Promise.all([
    db.landingContent.findFirst({
      where: { singleton: true },
      select: { viewCount: true, lastViewedAt: true },
    }),
    db.landingVisitDaily.findMany({
      where: { date: { gte: historyStart } },
      orderBy: { date: 'asc' },
      select: { date: true, viewCount: true },
    }),
  ])

  const viewsByDay = new Map(
    dailyRows.map((row) => [landingDayKey(row.date), row.viewCount]),
  )
  const history = Array.from({ length: HISTORY_DAYS }, (_, index) => {
    const date = new Date(historyStart)
    date.setUTCDate(date.getUTCDate() + index)
    const key = landingDayKey(date)
    return { date: key, views: viewsByDay.get(key) ?? 0 }
  })
  const sumViews = (days: typeof history) =>
    days.reduce((total, day) => total + day.views, 0)

  return {
    viewCount: summary?.viewCount ?? 0,
    lastViewedAt: summary?.lastViewedAt ?? null,
    todayViews: history.at(-1)?.views ?? 0,
    last7Days: sumViews(history.slice(-COMPARISON_DAYS)),
    previous7Days: sumViews(
      history.slice(-COMPARISON_DAYS * 2, -COMPARISON_DAYS),
    ),
    last30Days: sumViews(history),
    history,
  }
}
