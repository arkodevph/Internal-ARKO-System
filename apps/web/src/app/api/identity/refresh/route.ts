import { NextResponse } from 'next/server'
import { z } from 'zod'
import { APPLICATIONS, refreshAppSession } from '../../../../lib/app-sessions'

const bodySchema = z.object({
  refreshToken: z.string().min(32),
  application: z.enum(APPLICATIONS),
})

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tokens = await refreshAppSession(body.data.refreshToken, body.data.application)
  if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(tokens, { headers: { 'Cache-Control': 'no-store' } })
}
