# CI build missing `DATABASE_URL`

## Symptom

`pnpm build` compiled successfully in GitHub Actions but failed while prerendering `/` because Prisma could not find `DATABASE_URL`.

## Root cause

The statically generated marketing pages call `getLandingContent()`. That loader always initialized Prisma, even though it already supports complete built-in landing content when no database row exists. CI intentionally had no database secret available during the build.

## Fix

When `DATABASE_URL` is absent, the public landing content loader returns the built-in defaults without touching Prisma. Configured deployments continue reading stored admin-managed content normally.

## Verification

- Unit tests cover configured and missing-database paths.
- Root `pnpm build` succeeds with `DATABASE_URL` removed from the environment.
