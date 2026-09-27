import { logout } from '@arko/edge-auth'
import type { NextRequest } from 'next/server'

export const POST = (request: NextRequest) => logout(request, 'finance')
