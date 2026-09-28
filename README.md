# ARKO

ARKO is a pnpm/Next.js monorepo. Vercel hosts the public landing page; one Render web service named `arko` runs the authenticated system, finance, client portal, PM board, and API. PostgreSQL stays in the existing Supabase project.

| Area | URL |
| --- | --- |
| Public site | `https://arkodevph.com/` |
| System dashboard | `https://app.arkodevph.com/dashboard` |
| Finance | `https://app.arkodevph.com/dashboard/finance` |
| Client portal | `https://app.arkodevph.com/dashboard/client-portal` |
| PM board | `https://app.arkodevph.com/dashboard/pm` |
| API | `https://app.arkodevph.com/api/*` |

One Auth.js login at `https://app.arkodevph.com/auth/login` uses existing ARKO accounts and a same-origin session. Each dashboard area still enforces its role/permission checks. The Render Blueprint declares only `arko`; old Render services must be retired separately after cutover. See [Architecture](docs/ARCHITECTURE.md) and [deployment](docs/DEPLOY-INFRA.md).

## Local development

Use Node 20+ and pnpm 9.12.0. Set Supabase credentials in `apps/web/.env.local` and `packages/db/.env` using `apps/web/.env.example` as a guide. Both URLs must point to the same Supabase database and the existing `arko` schema; never point migrations at `public` accidentally.

```bash
pnpm install --frozen-lockfile
pnpm --filter @arko/db db:generate
pnpm --filter @arko/web dev                    # localhost:3000
```

Run `pnpm --filter @arko/web test -- --runInBand` and `pnpm --filter @arko/web build` before deploying. Database migrations remain a manual gate; see [deployment instructions](docs/DEPLOY-INFRA.md).
