# ARKO

ARKO is a pnpm/Next.js monorepo. One Render web service runs the public site, internal dashboard, finance, client portal, PM board, and API. PostgreSQL stays in the existing Supabase project.

| Area | Path on `arko-internal.onrender.com` |
| --- | --- |
| Public site | `/` |
| Internal dashboard | `/dashboard` (or `/app`) |
| Finance | `/dashboard/finance` (or `/finance`) |
| Client portal | `/dashboard/client-portal` (or `/portal`) |
| PM board | `/dashboard/pm` (or `/pm`) |
| API | `/api/*` |

One Auth.js login at `/auth/login` uses existing ARKO accounts and a same-origin session. Each dashboard area still enforces its role/permission checks. During cutover, the five previous services remain declared for rollback with auto-deploy off; CI builds only the unified app. See [Architecture](docs/ARCHITECTURE.md) and [Render deployment](docs/DEPLOY-INFRA.md).

## Local development

Use Node 20+ and pnpm 9.12.0. Set Supabase credentials in `apps/web/.env.local` and `packages/db/.env` using `apps/web/.env.example` as a guide. Both URLs must point to the same Supabase database and the existing `arko` schema; never point migrations at `public` accidentally.

```bash
pnpm install --frozen-lockfile
pnpm --filter @arko/db db:generate
pnpm --filter @arko/web dev                    # localhost:3000
```

Run `pnpm --filter @arko/web test -- --runInBand` and `pnpm --filter @arko/web build` before deploying. Database migrations remain a manual gate; see [deployment instructions](docs/DEPLOY-INFRA.md).
