import { login } from '@arko/edge-auth'
import type { NextRequest } from 'next/server'

export const POST = (request: NextRequest) => login(request, 'pm')
