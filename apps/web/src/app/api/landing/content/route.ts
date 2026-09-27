import { NextResponse } from 'next/server'
import { loadLandingContent } from '../../../../lib/landing/get-content'

export async function GET() {
  return NextResponse.json(await loadLandingContent())
}
