import { auth } from '../auth'
import { prisma, type Role } from '@arko/db'
import { serverEnv } from '../env'

export async function createTRPCContext() {
  // Fail fast on a misconfigured deployment (missing NEXTAUTH_SECRET, DATABASE_URL, …).
  serverEnv()
  const session = await auth()

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
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
