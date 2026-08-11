import { describe, expect, it, jest } from '@jest/globals'
import { materializeReminderNotifications } from '../reminder-notifications'

describe('materializeReminderNotifications', () => {
  it('creates one notification for a due reminder and claims it atomically', async () => {
    const dueAt = new Date(Date.now() + 5 * 60_000)
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const create = jest.fn().mockResolvedValue({ id: 'notification-1' })
    const prisma = {
      reminder: {
        findMany: jest.fn().mockResolvedValue([{
          id: 'reminder-1',
          title: 'Client call',
          note: 'Prepare the update',
          dueAt,
          recurrence: 'NONE',
          notifyMinutesBefore: 15,
          lastNotifiedAt: null,
        }]),
        updateMany,
      },
      notification: { create },
    }

    await materializeReminderNotifications(prisma, 'user-1')

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'reminder-1', lastNotifiedAt: null },
    }))
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        notifType: 'REMINDER_DUE',
        userId: 'user-1',
        link: '/dashboard/reminders',
      }),
    })
  })

  it('does not notify before the configured lead time', async () => {
    const updateMany = jest.fn()
    const create = jest.fn()
    const prisma = {
      reminder: {
        findMany: jest.fn().mockResolvedValue([{
          id: 'reminder-1',
          dueAt: new Date(Date.now() + 60 * 60_000),
          recurrence: 'NONE',
          notifyMinutesBefore: 15,
          lastNotifiedAt: null,
        }]),
        updateMany,
      },
      notification: { create },
    }

    await materializeReminderNotifications(prisma, 'user-1')

    expect(updateMany).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })
})
