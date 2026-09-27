# Render deployment with Supabase PostgreSQL

`render.yaml` defines six Node web services using their temporary `*.onrender.com` URLs. It requests no custom domains and **does not** create a Render database. The existing Supabase PostgreSQL project remains the single source of truth.

GitHub Actions runs schema validation, lint, tests, and production builds on pushes and pull requests. Render's `autoDeployTrigger: checksPass` starts a service deployment only after the checks on its linked branch pass. No Render deploy-hook secrets are needed. Blueprint configuration itself may still auto-sync when `render.yaml` changes; the initial Blueprint creation and migration review remain manual steps.

## Before creating the Blueprint

1. Back up the Supabase database and verify the existing Prisma migration history in the `arko` schema. A read-only `prisma migrate status` check on 2026-09-27 found **three pending migrations**: `20260820000000_add_nex_send_and_reminder_permissions`, `20260926000000_pm_required_deadline_review_gate`, and `20260927120000_add_app_sessions`. The first changes user permission arrays; the second backfills task deadlines and creates review records. A read-only query found **six tasks with null deadlines**; the PM migration will set each deadline to its creation time, potentially making them overdue. Do not auto-apply them blindly. Compare those SQL files with the production schema/data, then run `pnpm --filter @arko/db db:deploy` manually after backup and approval. The Blueprint intentionally has no automatic migration command.
2. Create a Render Blueprint from this repository and review the six service plans/costs. The Blueprint explicitly requests Render's Free plan for each service. Free instances share the workspace's monthly instance-hour allowance and spin down when idle, so this is suitable for evaluation rather than reliable production hosting. The API can return a healthy `/health` before the migrations, but identity login needs the `AppSession` table; do not open the new apps to users until the migration gate is complete.
3. Set `DATABASE_URL` and `DIRECT_URL` on `arko-api` and `arko-internal` to the **same Supabase project**, with `schema=arko`. Use the appropriate Supabase pooler URL for Render's IPv4 network. The existing `apps/web/.env.example` shows transaction-pooler runtime and session-pooler migration examples. Never place these URLs on site, finance, portal, or PM.
4. Let Render generate `AUTH_SECRET` for API/site/internal, or set strong values manually. Set `RATE_LIMIT_SECRET` on the public site, `RESEND_API_KEY` for the contact form, and any S3/email/AI integration variables those existing features need. Finance, portal, and PM use `ARKO_API_URL=https://arko-api.onrender.com`; no database credential belongs there. The existing five-minute GitHub email scheduler is not redirected to a free Render service: frequent requests would prevent spin-down and consume the workspace's free instance-hour allowance. Review that workflow separately before enabling scheduled email on Render.
5. Confirm the actual `onrender.com` URL assigned to each service in Render. If a URL has a suffix, update the corresponding Blueprint URL values and the email scheduler target. Verify the API's `/health` at its assigned URL before opening the other apps. Remove the two custom domains attached during the failed initial sync (`api.arkodevph.com` and `pm.arkodevph.com`) from their services' Settings → Custom Domains; removing them from `render.yaml` alone may not remove existing dashboard entries. No DNS changes are needed for `onrender.com` URLs.

## Smoke test after deployment

- Check public marketing page, contact form, and a landing view event.
- Log into the internal dashboard as staff; verify a restricted or client account cannot enter.
- Log into finance as a permitted staff member, portal as a client, and PM as staff. Verify each app returns only its permitted data.
- Log out of one app and confirm the other app session remains usable. Test token expiry/refresh and account suspension.
- Confirm Supabase has one new `AppSession` table in `arko` and no new database project was created.

Until the remaining internal legacy routes are migrated, `arko-internal` still connects directly to Supabase. Do not claim the whole system is API-only or remove its database secret yet. See [Architecture](ARCHITECTURE.md).
