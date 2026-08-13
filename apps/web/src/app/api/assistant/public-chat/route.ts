import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { LandingContent } from '../../../../lib/landing/content'
import { loadLandingContent } from '../../../../lib/landing/get-content'

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(500),
  })).min(1).max(8),
})

const PUBLIC_FALLBACK = 'What would you like to know about ARKO?'
const PUBLIC_SUGGESTIONS = ['Services', 'Pricing', 'Portfolio', 'Process', 'Start a project']

function publicReply(input: string, content: LandingContent) {
  const message = input.toLowerCase()

  if (
    /\b(user|password|task|calendar|event|note|finance|income|expense|document|message|client|workspace|dashboard|record|admin)\w*\b/.test(
      message,
    )
  ) {
    return 'That information is private to the ARKO system. Sign in with an authorized account to ask about workspace records or actions.'
  }

  if (/price|pricing|cost|budget|how much/.test(message)) {
    return 'Happy to help with that. Project cost depends on scope, so share your rough budget and brief and ARKO will map out what is realistic before any commitment.'
  }
  if (/\b(dev|developer|team|founder|creator|people|behind arko|github)\b/.test(message)) {
    return `ARKO is an independent software studio based in ${content.footer.location}. The studio handles design and development together, with no middlemen between clients and the code. You can review its public work at ${content.footer.githubUrl}.`
  }
  if (/portfolio|projects|case stud|previous work|project examples|showcase/.test(message)) {
    const projects = content.projects.items.slice(0, 6).map((project) => project.title).join(', ')
    return `Selected ARKO work includes ${projects}. Visit the Projects page to explore the full portfolio and live builds.`
  }
  if (/tech|stack|framework|language|tool|next\.?js|react|tailwind/.test(message)) {
    const technologies = [...new Set(content.work.cards.flatMap((card) => card.tags))].join(', ')
    return `ARKO chooses the stack around the product. Technologies shown across its public work include ${technologies}, alongside automation, webhooks, vector search, LLMs, and cross-platform mobile tooling.`
  }
  if (/process|workflow|how do you work|steps|discovery/.test(message)) {
    return `ARKO’s process has four stages: ${content.process.steps.map((step) => step.title).join(', ')}. Design and engineering happen together, with working software reviewed in short cycles.`
  }
  if (/support|maintenance|after launch|handover|hand.?off|documentation|source code/.test(message)) {
    return content.process.steps.at(-1)?.body ?? 'ARKO provides clean code, documentation, handover, and optional ongoing support without lock-in.'
  }
  if (/blog|article|writing|update|news/.test(message)) {
    return content.blogs.items.length > 0
      ? `ARKO currently has ${content.blogs.items.length} public update${content.blogs.items.length === 1 ? '' : 's'} on the Blogs page.`
      : 'ARKO’s Blogs page is where launches, ideas, and behind-the-scenes studio updates are published.'
  }
  if (/long|timeline|how soon|when|duration/.test(message)) {
    return 'A focused website usually ships in a few weeks. Larger apps and systems take longer, with milestones agreed up front.'
  }
  if (/build|service|offer|do you do|capabilit/.test(message)) {
    return `ARKO builds web and mobile products, including ${content.work.cards.map((card) => card.title.toLowerCase()).join(', ')}, plus design prototypes and performance improvements.`
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
  if (/inquir|interested|help me choose/.test(message)) {
    return PUBLIC_FALLBACK
  }
  if (/hello|hey|hi|who are you|what are you/.test(message)) {
    return 'Hey, y’all! I’m NEX, ARKO’s studio operations guide. Ask me about services, timing, pricing, ownership, or how to get your project started.'
  }

  return PUBLIC_FALLBACK
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

  const content = await loadLandingContent()
  const message = publicReply(latest.content, content)
  return NextResponse.json(
    {
      message,
      suggestions: message === PUBLIC_FALLBACK ? PUBLIC_SUGGESTIONS : undefined,
      scope: 'public-arko',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
