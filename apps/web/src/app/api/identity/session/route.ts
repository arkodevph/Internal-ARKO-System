import { NextResponse } from 'next/server'
import { APPLICATIONS, getAppSession } from '../../../../lib/app-sessions'

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  const application = request.headers.get('x-arko-application')
  if (!token || !APPLICATIONS.some((value) => value === application)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const session = await getAppSession(token, application as (typeof APPLICATIONS)[number])
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, name, email, image, role, permissions } = session.user
  return NextResponse.json({
    user: { id, name, email, image, role, permissions },
    expires: session.accessExpiresAt.toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
