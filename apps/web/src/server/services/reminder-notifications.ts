function nextOccurrence(date: Date, recurrence: string) {
  const next = new Date(date)
  if (recurrence === 'DAILY') next.setDate(next.getDate() + 1)
  if (recurrence === 'WEEKLY') next.setDate(next.getDate() + 7)
  if (recurrence === 'MONTHLY') next.setMonth(next.getMonth() + 1)
  return next
}

export async function materializeReminderNotifications(prisma: any, userId: string) {
  const now = new Date()
  const horizon = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000)
  const reminders = await prisma.reminder.findMany({
    where: { userId, isDone: false, dueAt: { lte: horizon } },
    orderBy: { dueAt: 'asc' },
    take: 100,
  })

  for (const reminder of reminders) {
    const notifyAt = new Date(
      reminder.dueAt.getTime() - reminder.notifyMinutesBefore * 60_000,
    )
    if (notifyAt > now || (reminder.lastNotifiedAt && reminder.lastNotifiedAt >= notifyAt)) {
      continue
    }

    const recurring = reminder.recurrence !== 'NONE'
    const claimed = await prisma.reminder.updateMany({
      where: {
        id: reminder.id,
        ...(reminder.lastNotifiedAt
          ? { lastNotifiedAt: reminder.lastNotifiedAt }
          : { lastNotifiedAt: null }),
      },
      data: {
        lastNotifiedAt: now,
        ...(recurring && {
          dueAt: nextOccurrence(reminder.dueAt, reminder.recurrence),
        }),
      },
    })
    if (!claimed.count) continue

    await prisma.notification.create({
      data: {
        notifType: 'REMINDER_DUE',
        title: reminder.title,
        message: reminder.note || 'Your reminder is due soon.',
        link: '/dashboard/reminders',
        userId,
      },
    })
  }
}
