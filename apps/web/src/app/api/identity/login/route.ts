import { NextResponse } from 'next/server'
import { z } from 'zod'
import { APPLICATIONS, createAppSession } from '../../../../lib/app-sessions'
import { authLimiter, loginLockout } from '../../../../lib/rate-limit'

const bodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(1024),
  application: z.enum(APPLICATIONS),
})

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
  const email = body.data.email.trim().toLowerCase()
  // The request comes from a same-origin BFF, not directly from the browser.
  // Its IP is the BFF service IP, so an API-level IP limit would lock out all users together.
  if (!authLimiter.check(email).success ||
      !loginLockout.peek(email).success) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }
  const tokens = await createAppSession(email, body.data.password, body.data.application)
  if (!tokens) {
    loginLockout.check(email)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  loginLockout.clear(email)
  return NextResponse.json(tokens, { headers: { 'Cache-Control': 'no-store' } })
}
