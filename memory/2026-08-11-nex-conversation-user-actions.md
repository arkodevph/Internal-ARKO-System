# NEX conversation and user-action debug report

- **Symptom:** Normal conversation repeatedly returned the same scope refusal, and NEX could not add system users.
- **Root cause:** A keyword allowlist rejected ordinary messages before Vertex could interpret them. Refusals were replaced by a hard-coded sentence in two layers. The assistant action union had no user action.
- **Fix:** Keep only the prompt-injection prefilter, let Vertex handle normal conversation and safe contextual refusals, provide visible user context, and add an admin-only confirmed `create_user` action with server-generated credentials.
- **Evidence:** Assistant, chat-route, and action-route regression tests pass; full Jest suite passes with 323 tests; Next.js production build succeeds.
- **Regression tests:** `apps/web/src/server/services/__tests__/assistant.test.ts`, `apps/web/src/app/api/assistant/chat/__tests__/route.test.ts`, and `apps/web/src/app/api/assistant/actions/__tests__/route.test.ts`.
- **Status:** DONE
