import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const findFirst = jest.fn()
const create = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: { task: { findFirst, create } },
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

describe('assistant action route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)
    findFirst.mockResolvedValue({ position: 3 })
    create.mockResolvedValue({ id: 'task-1', title: validAction.title })
  })

  it('requires authentication', async () => {
    authMock.mockResolvedValue(null)
    expect((await POST(request(validAction))).status).toBe(401)
  })

  it('enforces tasks:create permission', async () => {
    authMock.mockResolvedValue({ user: { id: 'client-1', role: 'CLIENT' } } as any)
    expect((await POST(request(validAction))).status).toBe(403)
    expect(create).not.toHaveBeenCalled()
  })

  it('validates proposed actions', async () => {
    expect((await POST(request({ ...validAction, title: '' }))).status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a personal task assigned to the confirming user', async () => {
    const response = await POST(request(validAction))

    expect(response.status).toBe(200)
    expect(create).toHaveBeenCalledWith(
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
    create.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(request(validAction))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'The task could not be created.',
    })
  })
})
