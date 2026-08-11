import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const findFirst = jest.fn()
const createTask = jest.fn()
const createEvent = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: {
    task: { findFirst, create: createTask },
    event: { create: createEvent },
  },
}))
jest.mock('../../../../../lib/auth', () => ({ auth: jest.fn() }))

import { auth } from '../../../../../lib/auth'
import { POST } from '../route'

const authMock = jest.mocked(auth)

function request(body: unknown) {
  return new NextRequest('http://localhost/api/assistant/actions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const validAction = {
  type: 'create_task',
  title: 'Prepare proposal',
  description: 'Draft the first version',
  priority: 'HIGH',
}

const validEventAction = {
  type: 'create_event',
  title: 'Project meeting',
  description: 'Review delivery plan',
  date: '2026-08-12',
  startTime: '13:00',
  endTime: '14:00',
}

describe('assistant action route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)
    findFirst.mockResolvedValue({ position: 3 })
    createTask.mockResolvedValue({ id: 'task-1', title: validAction.title })
    createEvent.mockResolvedValue({
      id: 'event-1',
      title: validEventAction.title,
      date: new Date('2026-08-12T00:00:00+08:00'),
    })
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)
    expect((await POST(request(validAction))).status).toBe(401)
  })

  it('enforces tasks:create permission', async () => {
    authMock.mockResolvedValue({ user: { id: 'client-1', role: 'CLIENT' } } as any)
    expect((await POST(request(validAction))).status).toBe(403)
    expect(createTask).not.toHaveBeenCalled()
  })

  it('validates proposed actions', async () => {
    expect((await POST(request({ ...validAction, title: '' }))).status).toBe(400)
    expect(createTask).not.toHaveBeenCalled()
  })

  it('creates a personal task assigned to the confirming user', async () => {
    const response = await POST(request(validAction))

    expect(response.status).toBe(200)
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assigneeId: 'user-1',
          position: 4,
          scope: 'PERSONAL',
        }),
      }),
    )
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assigneeId: 'user-1', scope: 'PERSONAL' },
      }),
    )
  })

  it('returns a stable JSON error when task creation fails', async () => {
    createTask.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(request(validAction))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'The task could not be created.',
    })
  })

  it('creates a personal event owned by the confirming user', async () => {
    const response = await POST(request(validEventAction))

    expect(response.status).toBe(200)
    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          scope: 'PERSONAL',
          startTime: '13:00',
          endTime: '14:00',
        }),
      }),
    )
  })

  it('enforces events:create permission independently from task access', async () => {
    authMock.mockResolvedValue({
      user: { id: 'accountant-1', role: 'ACCOUNTANT' },
    } as any)

    expect((await POST(request(validEventAction))).status).toBe(403)
    expect(createEvent).not.toHaveBeenCalled()
  })

  it('rejects invalid calendar dates and time ranges', async () => {
    expect(
      (await POST(request({ ...validEventAction, date: '2026-02-31' }))).status,
    ).toBe(400)
    expect(
      (
        await POST(
          request({
            ...validEventAction,
            startTime: '14:00',
            endTime: '13:00',
          }),
        )
      ).status,
    ).toBe(400)
    expect(createEvent).not.toHaveBeenCalled()
  })
})
