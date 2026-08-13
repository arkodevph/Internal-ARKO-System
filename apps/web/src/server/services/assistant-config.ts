import { prisma } from '@arko/db'
import { z } from 'zod'

export const assistantConfigSchema = z.object({
  assistantName: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[\p{L}\p{N} .'-]+$/u),
  iconStyle: z.enum(['BOT', 'SPARK', 'ORBIT', 'BRAIN']),
  accentColor: z.enum(['#22C55E', '#22D3EE', '#A78BFA', '#FBBF24']),
  greeting: z.string().trim().min(10).max(180),
  personality: z.string().trim().min(10).max(500),
  projectId: z.string().trim().regex(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/),
  location: z.string().trim().regex(/^[a-z0-9-]{2,30}$/),
  model: z.string().trim().regex(/^[a-zA-Z0-9._-]{2,100}$/),
  gcpProjectNumber: z.string().trim().regex(/^\d{6,20}$/),
  serviceAccountEmail: z
    .string()
    .trim()
    .email()
    .regex(/\.iam\.gserviceaccount\.com$/),
  workloadIdentityPoolId: z.string().trim().regex(/^[a-z0-9-]{2,32}$/),
  workloadIdentityProviderId: z.string().trim().regex(/^[a-z0-9-]{2,32}$/),
})

export type AssistantConfig = z.infer<typeof assistantConfigSchema>

export async function getAssistantConfig(): Promise<AssistantConfig> {
  const saved = await prisma.assistantConfiguration.findUnique({
    where: { id: 'system' },
    select: {
      assistantName: true,
      iconStyle: true,
      accentColor: true,
      greeting: true,
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

  return {
    assistantName: saved?.assistantName ?? 'NEX',
    iconStyle: (saved?.iconStyle ?? 'BOT') as AssistantConfig['iconStyle'],
    accentColor: (saved?.accentColor ??
      '#22C55E') as AssistantConfig['accentColor'],
    greeting:
      saved?.greeting ??
      'Hey, y’all! I’m NEX, your ARKO operations guide. Tell me what needs sorting, and I’ll line it up for your approval before changing anything.',
    personality:
      saved?.personality ??
      'Sunny, courteous, reassuring, precise, and efficient, with subtly uncanny confidence. Acknowledge requests, explain boundaries politely, and recap proposed actions clearly before asking for confirmation.',
    projectId: saved?.projectId ?? process.env.GOOGLE_CLOUD_PROJECT ?? '',
    location: saved?.location ?? process.env.GOOGLE_CLOUD_LOCATION ?? 'global',
    model: saved?.model ?? process.env.GOOGLE_VERTEX_MODEL ?? 'gemini-2.5-flash',
    gcpProjectNumber:
      saved?.gcpProjectNumber || process.env.GCP_PROJECT_NUMBER || '',
    serviceAccountEmail:
      saved?.serviceAccountEmail || process.env.GCP_SERVICE_ACCOUNT_EMAIL || '',
    workloadIdentityPoolId:
      saved?.workloadIdentityPoolId ||
      process.env.GCP_WORKLOAD_IDENTITY_POOL_ID ||
      'vercel',
    workloadIdentityProviderId:
      saved?.workloadIdentityProviderId ||
      process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID ||
      'vercel',
  }
}
