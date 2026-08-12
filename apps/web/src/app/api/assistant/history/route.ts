import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'

export const runtime = 'nodejs'

const idSchema = z.string().cuid()

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversationId = new URL(request.url).searchParams.get('conversationId')
  if (conversationId) {
    if (!idSchema.safeParse(conversationId).success) {
      return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 })
    }

    const conversation = await prisma.assistantConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      select: {
        id: true,
        title: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true },
        },
      },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    return NextResponse.json(conversation)
  }

  const conversations = await prisma.assistantConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 40,
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json({ conversations })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversationId = new URL(request.url).searchParams.get('conversationId')
  if (!conversationId || !idSchema.safeParse(conversationId).success) {
    return NextResponse.json({ error: 'Invalid conversation' }, { status: 400 })
  }

  const result = await prisma.assistantConversation.deleteMany({
    where: { id: conversationId, userId: session.user.id },
  })
  if (!result.count) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }
  return NextResponse.json({ deleted: true })
}
