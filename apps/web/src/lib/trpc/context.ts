import { auth } from '../auth'
import { prisma, type Role } from '@arko/db'
import { serverEnv } from '../env'
import { getAppSession, type Application } from '../app-sessions'
import type { Session } from 'next-auth'

export async function createTRPCContext({ req }: { req?: Request } = {}) {
  // Fail fast on a misconfigured deployment (missing NEXTAUTH_SECRET, DATABASE_URL, …).
  serverEnv()
  const bearer = req?.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const appSession = bearer ? await getAppSession(bearer) : null
  const session = bearer
    ? appSession
      ? ({
          user: {
            id: appSession.user.id,
            name: appSession.user.name,
            email: appSession.user.email,
            image: appSession.user.image,
            role: appSession.user.role,
            permissions: appSession.user.permissions,
          },
          expires: appSession.accessExpiresAt.toISOString(),
        } as Session)
      : null
    : await auth()

  // Fetch the user's role from DB (fresh on every request)
  let userRole: Role | undefined
  let userPermissions: unknown
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, permissions: true },
    })
    userRole = dbUser?.role ?? undefined
    userPermissions = dbUser?.permissions ?? undefined
  }

  return {
    prisma,
    session,
    user: session?.user,
    userRole,
    userPermissions,
    application: appSession?.application as Application | undefined,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
