import { NextResponse } from 'next/server'
import { prisma } from '@arko/db'

export async function POST() {
  await prisma.landingContent.upsert({
    where: { singleton: true },
    create: { singleton: true, viewCount: 1, lastViewedAt: new Date() },
    update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
  })

  return new NextResponse(null, { status: 204 })
}
