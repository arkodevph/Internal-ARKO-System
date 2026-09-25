# Dashboard development asset failure

- Symptom: assistant identity returned 500 and dashboard chunks/CSS returned 404 during development.
- Root cause: the identity route propagated database/config lookup failures. A production build was also run while `next dev` was active, causing both processes to write incompatible artifacts into `.next`.
- Fix: return the public default NEX identity if configuration cannot be loaded; restart the development server after the build. Updated the deprecated Three.js shadow-map constant and prioritized the above-fold hero image.
- Regression test: `apps/web/src/app/api/assistant/identity/__tests__/route.test.ts` covers configuration failure.
- Verification: identity, CSS, and current app chunks return HTTP 200; focused identity tests pass.
- Recurrence: `Cannot find module './2727.js'` confirmed a mixed runtime: `webpack-runtime.js` expected a root server chunk while only `server/chunks/2727.js` existed. All Next writers were stopped, both partially moved cache fragments were quarantined under `/tmp/arko-next-corrupt.*`, and one clean `next dev` process tree regenerated `.next`.
- Status: DONE
