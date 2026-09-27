import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { compare } from 'bcryptjs'

const findUser = jest.fn()
const createSession = jest.fn()
const findSession = jest.fn()
const updateSession = jest.fn()
const deleteSession = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: {
    user: { findFirst: findUser },
    appSession: {
      create: createSession,
      findUnique: findSession,
      updateMany: updateSession,
      deleteMany: deleteSession,
    },
  },
}))
jest.mock('bcryptjs', () => ({ compare: jest.fn() }))

import { createAppSession, getAppSession, refreshAppSession, revokeAppSession } from '../app-sessions'

const user = {
  id: 'user-1', email: 'user@example.com', password: 'hash',
  role: 'MEMBER', status: 'ACTIVE', permissions: ['transactions:read'], authVersion: 2,
}

describe('application sessions', () => {
  beforeEach(() => {
    findUser.mockReset().mockResolvedValue(user)
    createSession.mockReset().mockResolvedValue({ id: 'session-1' })
    findSession.mockReset()
    updateSession.mockReset().mockResolvedValue({ count: 1 })
    deleteSession.mockReset()
    jest.mocked(compare).mockReset().mockResolvedValue(true as never)
  })

  it('separates client and staff logins', async () => {
    expect(await createAppSession('user@example.com', 'password', 'portal')).toBeNull()
    expect(createSession).not.toHaveBeenCalled()
    findUser.mockResolvedValue({ ...user, role: 'CLIENT' })
    expect(await createAppSession('user@example.com', 'password', 'finance')).toBeNull()
    expect(await createAppSession('user@example.com', 'password', 'portal')).toEqual(
      expect.objectContaining({ sessionId: 'session-1' }),
    )
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ application: 'portal', authVersion: 2 }),
    }))
  })

  it('rejects expired access, cross-app use, and revoked users', async () => {
    findSession.mockResolvedValue({
      application: 'finance',
      accessExpiresAt: new Date(Date.now() + 60_000),
      user,
      authVersion: 2,
    })
    expect(await getAppSession('token', 'portal')).toBeNull()
    expect(await getAppSession('token', 'finance')).not.toBeNull()
    findSession.mockResolvedValueOnce({
      application: 'finance',
      accessExpiresAt: new Date(Date.now() - 1), user, authVersion: 2,
    })
    expect(await getAppSession('token', 'finance')).toBeNull()
    findSession.mockResolvedValueOnce({
      application: 'finance',
      accessExpiresAt: new Date(Date.now() + 60_000), user, authVersion: 1,
    })
    expect(await getAppSession('token', 'finance')).toBeNull()
  })

  it('rotates refresh tokens only once and revokes the application session', async () => {
    findSession.mockResolvedValue({
      id: 'session-1', application: 'finance',
      refreshExpiresAt: new Date(Date.now() + 60_000), user, authVersion: 2,
    })
    const tokens = await refreshAppSession('old-refresh-token', 'finance')
    expect(tokens?.accessToken).toBeTruthy()
    expect(tokens?.refreshToken).toBeTruthy()
    expect(tokens?.refreshToken).not.toBe('old-refresh-token')
    expect(updateSession).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'session-1', refreshTokenHash: expect.any(String) }),
    }))
    updateSession.mockResolvedValueOnce({ count: 0 })
    expect(await refreshAppSession('old-refresh-token', 'finance')).toBeNull()
    await revokeAppSession('old-refresh-token', 'finance')
    expect(deleteSession).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ application: 'finance' }),
    }))
  })
})
