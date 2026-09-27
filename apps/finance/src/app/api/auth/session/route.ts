import { session } from '@arko/edge-auth'
import type { NextRequest } from 'next/server'

export const GET = (request: NextRequest) => session(request, 'finance')
