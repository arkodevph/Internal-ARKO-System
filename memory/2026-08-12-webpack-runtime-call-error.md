# Webpack runtime `undefined.call` error

## Symptom

The local Next.js error overlay reported `Cannot read properties of undefined (reading 'call')`.

## Root cause

A production `next build` ran while the Next.js development server was still active. Both processes used `apps/web/.next`, replacing the development module map and chunks. The browser then requested stale development assets; several `/_next/static` JavaScript and CSS requests returned 404, leaving Webpack without the requested module factory.

## Resolution

- Stop the existing development process.
- Move the stale generated `.next` cache to `/tmp`.
- Restart `pnpm --filter web dev` to regenerate a consistent development bundle.

## Verification

- A fresh browser reload reports no console errors.
- Fresh page assets return successfully instead of 404.
- No application source change was required.

## Prevention

Do not run `next build` concurrently with `next dev` when both use the default `.next` output directory. Stop development first or run production verification separately.
