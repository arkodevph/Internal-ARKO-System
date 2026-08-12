import { NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(500),
  })).min(1).max(8),
})

function publicReply(input: string) {
  const message = input.toLowerCase()

  if (
    /\b(user|password|task|calendar|event|note|finance|income|expense|document|message|client|workspace|dashboard|record|admin)\w*\b/.test(
      message,
    )
  ) {
    return 'That information is private to the ARKO system. Sign in with an authorized account to ask about workspace records or actions.'
  }

  if (/price|pricing|cost|budget|how much/.test(message)) {
    return 'Project cost depends on scope. Share your rough budget and brief; ARKO will tell you what is realistic before any commitment.'
  }
  if (/long|timeline|how soon|when|duration/.test(message)) {
    return 'A focused website usually ships in a few weeks. Larger apps and systems take longer, with milestones agreed up front.'
  }
  if (/build|service|offer|do you do|capabilit/.test(message)) {
    return 'ARKO builds web and mobile products, automation pipelines, AI features, design prototypes, and performance improvements.'
  }
  if (/owner|code|handoff|lock.?in/.test(message)) {
    return 'You own the code, accounts, and assets at handoff. ARKO does not lock clients into the studio.'
  }
  if (/outside|worldwide|country|philippines|location/.test(message)) {
    return 'ARKO is based in the Philippines and works with clients worldwide using an async-first process.'
  }
  if (/contact|email|start|hire|project|talk|reply/.test(message)) {
    return 'Send a short project brief through the contact form or email arkodevph@gmail.com. ARKO usually replies within 24 hours.'
  }
  if (/hello|hey|hi|who are you|what are you/.test(message)) {
    return 'I’m NEX, ARKO’s studio assistant. Ask me about our services, project timing, pricing approach, ownership, or how to start.'
  }

  return 'I can answer questions about ARKO’s services and project process. For workspace records or actions, sign in to the ARKO system.'
}

export async function POST(request: Request) {
  const input = requestSchema.safeParse(await request.json().catch(() => null))
  if (!input.success) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
  }

  const latest = [...input.data.messages].reverse().find((message) => message.role === 'user')
  if (!latest) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 })
  }

  return NextResponse.json(
    { message: publicReply(latest.content), scope: 'public-arko' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
