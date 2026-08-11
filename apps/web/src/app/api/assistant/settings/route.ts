import { NextResponse } from 'next/server'
import { prisma } from '@arko/db'
import { auth } from '../../../../lib/auth'
import {
  assistantConfigSchema,
  getAssistantConfig,
} from '../../../../server/services/assistant-config'
import { generateAssistantReply } from '../../../../server/services/assistant'
import { consumeAssistantRequest } from '../../../../server/services/assistant-rate-limit'

function isAdmin(role: string | undefined) {
  return role === 'ADMIN'
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const config = await getAssistantConfig()
  return NextResponse.json({
    ...config,
    identity: config.serviceAccountEmail || 'Local Google ADC',
    authMode: process.env.VERCEL ? 'Vercel OIDC' : 'Google ADC',
  })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const input = assistantConfigSchema.safeParse(
    await request.json().catch(() => null),
  )
  if (!input.success) {
    return NextResponse.json({ error: 'Invalid Vertex configuration' }, { status: 400 })
  }

  const saved = await prisma.assistantConfiguration.upsert({
    where: { id: 'system' },
    create: { id: 'system', ...input.data, updatedById: session.user.id },
    update: { ...input.data, updatedById: session.user.id },
    select: {
      assistantName: true,
      personality: true,
      projectId: true,
      location: true,
      model: true,
      gcpProjectNumber: true,
      serviceAccountEmail: true,
      workloadIdentityPoolId: true,
      workloadIdentityProviderId: true,
    },
  })
  return NextResponse.json(saved)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await consumeAssistantRequest(session.user.id)
    const config = await getAssistantConfig()
    const result = await generateAssistantReply({
      messages: [{ role: 'user', content: 'Show ARKO system help.' }],
      context: {
        canCreateTasks: false,
        canCreateEvents: false,
        contextTruncated: false,
        tasks: [],
        events: [],
      },
      config,
      oidcToken: request.headers.get('x-vercel-oidc-token') ?? undefined,
    })
    return NextResponse.json({ connected: true, model: result.model })
  } catch {
    return NextResponse.json(
      { error: 'Vertex AI connection failed.' },
      { status: 503 },
    )
  }
}
