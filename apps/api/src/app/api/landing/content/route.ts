import { NextResponse } from 'next/server'
import { loadLandingContent } from '../../../../../../web/src/lib/landing/get-content'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await loadLandingContent(), { headers: { 'Cache-Control': 'no-store' } })
}
