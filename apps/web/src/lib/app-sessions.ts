import { createHash, randomBytes } from 'node:crypto'
import { compare } from 'bcryptjs'
import { prisma, type Role } from '@arko/db'
import { hasPermission } from './rbac'

export const APPLICATIONS = ['internal', 'finance', 'portal', 'pm'] as const
export type Application = (typeof APPLICATIONS)[number]

const ACCESS_AGE_MS = 15 * 60 * 1000
const REFRESH_AGE_MS = 7 * 24 * 60 * 60 * 1000

function hash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function newToken() {
  return randomBytes(32).toString('base64url')
}

function canEnter(application: Application, role: Role, permissions: unknown) {
  if (role === 'INTERN') return false
  if (application === 'portal') return role === 'CLIENT'
  if (application === 'finance') {
    return role !== 'CLIENT' && role !== 'DEMO' &&
      hasPermission(role, 'transactions:read', permissions)
  }
  return role !== 'CLIENT' && role !== 'DEMO'
}

export async function createAppSession(
  email: string,
  password: string,
  application: Application,
) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
  })
  if (!user?.password || user.status !== 'ACTIVE' ||
      !await compare(password, user.password) ||
      !canEnter(application, user.role, user.permissions)) return null

  const accessToken = newToken()
  const refreshToken = newToken()
  const now = Date.now()
  const session = await prisma.appSession.create({
    data: {
      userId: user.id,
      application,
      accessTokenHash: hash(accessToken),
      refreshTokenHash: hash(refreshToken),
      authVersion: user.authVersion,
      accessExpiresAt: new Date(now + ACCESS_AGE_MS),
      refreshExpiresAt: new Date(now + REFRESH_AGE_MS),
    },
  })
  return { accessToken, refreshToken, sessionId: session.id }
}

export async function getAppSession(accessToken: string, application?: Application) {
  const session = await prisma.appSession.findUnique({
    where: { accessTokenHash: hash(accessToken) },
    include: {
      user: {
        select: {
          id: true, email: true, name: true, image: true,
          role: true, permissions: true, status: true, authVersion: true,
        },
      },
    },
  })
  if (!session || session.accessExpiresAt <= new Date() ||
      (application && session.application !== application) ||
      session.user.status !== 'ACTIVE' ||
      session.authVersion !== session.user.authVersion ||
      !canEnter(session.application as Application, session.user.role, session.user.permissions)) {
    return null
  }
  return session
}

export async function refreshAppSession(refreshToken: string, application: Application) {
  const oldHash = hash(refreshToken)
  const session = await prisma.appSession.findUnique({
    where: { refreshTokenHash: oldHash },
    include: { user: true },
  })
  if (!session || session.application !== application ||
      session.refreshExpiresAt <= new Date() ||
      session.user.status !== 'ACTIVE' ||
      session.authVersion !== session.user.authVersion ||
      !canEnter(application, session.user.role, session.user.permissions)) return null

  const accessToken = newToken()
  const nextRefreshToken = newToken()
  const now = Date.now()
  const updated = await prisma.appSession.updateMany({
    where: {
      id: session.id,
      refreshTokenHash: oldHash,
      refreshExpiresAt: { gt: new Date() },
    },
    data: {
      accessTokenHash: hash(accessToken),
      refreshTokenHash: hash(nextRefreshToken),
      accessExpiresAt: new Date(now + ACCESS_AGE_MS),
      refreshExpiresAt: new Date(now + REFRESH_AGE_MS),
      lastUsedAt: new Date(now),
    },
  })
  if (updated.count !== 1) return null
  return { accessToken, refreshToken: nextRefreshToken }
}

export async function revokeAppSession(refreshToken: string, application: Application) {
  await prisma.appSession.deleteMany({
    where: { refreshTokenHash: hash(refreshToken), application },
  })
}
