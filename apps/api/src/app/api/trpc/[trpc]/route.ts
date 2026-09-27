import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../../../../web/src/server/api/root'
import { createTRPCContext } from '../../../../../../web/src/lib/trpc/context'

export const runtime = 'nodejs'

const handler = (req: Request) => {
  if (!req.headers.get('authorization')?.match(/^Bearer .+$/i)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return fetchRequestHandler({
    endpoint: '/api/trpc', req, router: appRouter, createContext: createTRPCContext,
  })
}

export { handler as GET, handler as POST }
