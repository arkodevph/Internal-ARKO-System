# ARKO

ARKO is a pnpm/Next.js monorepo for the public site, internal workspace, finance, client portal, project-management board, and shared API. PostgreSQL stays in the existing Supabase project; Render runs the application services, not a second database.

| Service | Temporary Render URL | Source | Runtime data access |
| --- | --- | --- | --- |
| Public site | `arko-site.onrender.com` | `apps/web`, `ARKO_SURFACE=site` | Public API only at runtime |
| Internal | `arko-internal.onrender.com` | `apps/web`, `ARKO_SURFACE=internal` | Legacy Prisma and Auth.js paths remain |
| Finance | `arko-finance.onrender.com` | `apps/finance` | Central API only |
| Client portal | `arko-portal.onrender.com` | `apps/portal` | Central API only |
| PM board | `arko-pm.onrender.com` | `apps/pm` | Central API only |
| API and identity | `arko-api.onrender.com` | `apps/api` | Supabase PostgreSQL via Prisma |

The Render Blueprint temporarily requests no custom domains. Confirm each assigned `onrender.com` hostname in the Render dashboard before opening the apps; Render can suffix a hostname if the preferred name is taken.

The new apps have separate host-only, HTTP-only sessions. Users enter their existing ARKO email and password on each app; the central identity API issues an app-scoped session, and each app's server-side proxy calls the central API. This is not yet single sign-on. Signing in to one app does not automatically sign in to another.

The split is **in progress**: finance, portal, and PM have independent runtimes but still import some UI/type source from `apps/web` at build time. The site and internal service are two deployments of the existing web app; the public site's active routes now proxy persistence through the API, but the internal service still needs Supabase credentials. See [Architecture](docs/ARCHITECTURE.md) and [Render deployment](docs/DEPLOY-INFRA.md).

## Local development

Use Node 20+ and pnpm 9.12.0. Set Supabase credentials in `apps/web/.env.local` and `packages/db/.env` using `apps/web/.env.example` as a guide. Both URLs must point to the same Supabase database and the existing `arko` schema; never point migrations at `public` accidentally.

```bash
pnpm install --frozen-lockfile
pnpm --filter @arko/db db:generate
pnpm --filter @arko/api dev
```

In separate terminals, run whichever app you need:

```bash
pnpm --filter @arko/web dev                    # localhost:3000
pnpm --filter @arko/finance-app dev            # localhost:3001
pnpm --filter @arko/portal dev                 # localhost:3002
pnpm --filter @arko/pm dev                    # localhost:3004
```

`ARKO_API_URL` defaults to `http://localhost:3003` in development for finance, portal, and PM. Run the API first. For local identity login the API process needs `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` in its environment (the web app's `.env.local` is not loaded by the API app automatically).

Run `pnpm --filter @arko/web test -- --runInBand`, `pnpm --filter @arko/api typecheck`, and each app's `build` script before deploying. The `AppSession` migration has **not** been applied by this repository change; [deployment instructions](docs/DEPLOY-INFRA.md) explain why migration is a manual gate.
