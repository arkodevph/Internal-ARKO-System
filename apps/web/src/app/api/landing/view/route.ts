import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@arko/db'
import {
  landingDayKey,
  recordLandingVisit,
} from '../../../../server/services/landing-analytics'
import { publicApiUrl } from '../../../../lib/public-api'

const VISIT_COOKIE = 'arko_landing_visit_day'

export async function POST(request: NextRequest) {
  const viewedAt = new Date()
  const dayKey = landingDayKey(viewedAt)

  if (request.cookies.get(VISIT_COOKIE)?.value === dayKey) {
    return new NextResponse(null, { status: 204 })
  }

  if (process.env.ARKO_SURFACE === 'site') {
    const remote = await fetch(publicApiUrl('/api/landing/view'), { method: 'POST', cache: 'no-store' })
    if (!remote.ok) return new NextResponse(null, { status: 503 })
  } else {
    await recordLandingVisit(prisma, viewedAt)
  }

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(VISIT_COOKIE, dayKey, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60,
    path: '/',
  })
  return response
}
