import { z } from "zod";

/**
 * Server environment validation. Called at runtime (first tRPC request) so a
 * misconfigured deployment fails fast with a clear message instead of behaving
 * insecurely (e.g. a missing NEXTAUTH_SECRET). Not run at build time.
 *
 * Required vars are hard failures; integration vars (S3, email) are optional so
 * those features degrade rather than crash the whole app.
 */
const serverEnvSchema = z
  .object({
    // NextAuth v5 reads AUTH_SECRET; NEXTAUTH_SECRET is the v4 name. Accept either.
    AUTH_SECRET: z.string().min(1).optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1, "required - Postgres connection string"),
    DIRECT_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    // Storage / email integrations - optional; features degrade if unset.
    S3_BUCKET: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_REGION: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    FACEBOOK_PAGE_ID: z.string().optional(),
    FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
    RESEND_INBOUND_API_KEY: z.string().optional(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    GOOGLE_CLOUD_PROJECT: z.string().optional(),
    GOOGLE_CLOUD_LOCATION: z.string().optional(),
    GOOGLE_VERTEX_MODEL: z.string().optional(),
    GCP_PROJECT_NUMBER: z.string().optional(),
    GCP_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
    GCP_WORKLOAD_IDENTITY_POOL_ID: z.string().optional(),
    GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: z.string().optional(),
  })
  .refine((e) => Boolean(e.AUTH_SECRET || e.NEXTAUTH_SECRET), {
    message:
      "AUTH_SECRET (or NEXTAUTH_SECRET) is required - session signing secret",
    path: ["AUTH_SECRET"],
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid/missing environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
