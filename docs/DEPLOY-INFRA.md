# Render deployment with Supabase PostgreSQL

`render.yaml` defines six Node web services and custom domains. It **does not** create a Render database. The existing Supabase PostgreSQL project remains the single source of truth.

## Before creating the Blueprint

1. Back up the Supabase database and verify the existing Prisma migration history in the `arko` schema. A read-only `prisma migrate status` check on 2026-09-27 found **three pending migrations**: `20260820000000_add_nex_send_and_reminder_permissions`, `20260926000000_pm_required_deadline_review_gate`, and `20260927120000_add_app_sessions`. The first changes user permission arrays; the second backfills task deadlines and creates review records. A read-only query found **six tasks with null deadlines**; the PM migration will set each deadline to its creation time, potentially making them overdue. Do not auto-apply them blindly. Compare those SQL files with the production schema/data, then run `pnpm --filter @arko/db db:deploy` manually after backup and approval. The Blueprint intentionally has no automatic migration command.
2. Create a Render Blueprint from this repository and review the six service plans/costs. The Blueprint explicitly requests Render's Free plan for each service. Free instances share the workspace's monthly instance-hour allowance and spin down when idle, so this is suitable for evaluation rather than reliable production hosting. The API can return a healthy `/health` before the migrations, but identity login needs the `AppSession` table; do not open the new apps to users until the migration gate is complete.
3. Set `DATABASE_URL` and `DIRECT_URL` on `arko-api` and `arko-internal` to the **same Supabase project**, with `schema=arko`. Use the appropriate Supabase pooler URL for Render's IPv4 network. The existing `apps/web/.env.example` shows transaction-pooler runtime and session-pooler migration examples. Never place these URLs on site, finance, portal, or PM.
4. Let Render generate `AUTH_SECRET` for API/site/internal, or set strong values manually. Set `RATE_LIMIT_SECRET` on the public site, `RESEND_API_KEY` for the contact form, and any S3/email/AI integration variables those existing features need. Finance, portal, and PM use `ARKO_API_URL=https://api.arkodevph.com`; no database credential belongs there.
5. Deploy and verify `https://api.arkodevph.com/health` before enabling the other origins. Configure each custom domain in Render and update DNS as directed by Render. The custom domains are not activated by this file alone.

## Smoke test after deployment

- Check public marketing page, contact form, and a landing view event.
- Log into the internal dashboard as staff; verify a restricted or client account cannot enter.
- Log into finance as a permitted staff member, portal as a client, and PM as staff. Verify each app returns only its permitted data.
- Log out of one app and confirm the other app session remains usable. Test token expiry/refresh and account suspension.
- Confirm Supabase has one new `AppSession` table in `arko` and no new database project was created.

Until the remaining internal legacy routes are migrated, `arko-internal` still connects directly to Supabase. Do not claim the whole system is API-only or remove its database secret yet. See [Architecture](ARCHITECTURE.md).
