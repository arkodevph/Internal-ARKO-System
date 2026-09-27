import { NextResponse } from 'next/server'
import { z } from 'zod'
import { APPLICATIONS, revokeAppSession } from '../../../../lib/app-sessions'

const bodySchema = z.object({
  refreshToken: z.string().min(32),
  application: z.enum(APPLICATIONS),
})

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null))
  if (body.success) await revokeAppSession(body.data.refreshToken, body.data.application)
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
