import { proxyTRPC } from '@arko/edge-auth'
import type { NextRequest } from 'next/server'

const handler = (request: NextRequest) => proxyTRPC(request, 'portal')
export { handler as GET, handler as POST }
