# DEBUG REPORT — NEX actionable service errors

- **Symptom:** Every failed internal NEX request displayed “The assistant is temporarily unavailable,” including finance-action requests.
- **Root cause:** The chat route logged the original exception server-side but replaced every non-rate-limit error with the same fixed HTTP 503 message.
- **Fix:** Classify failures at the API boundary into deployment configuration, Vertex authentication, provider quota, timeout/network, invalid model output, workspace database, and unknown server failures. Return a safe explanation and confirm that no requested action was applied.
- **Evidence:** Route tests inject representative configuration, authorization, quota, and malformed-response errors and assert distinct client-safe explanations.
- **Regression test:** `apps/web/src/app/api/assistant/chat/__tests__/route.test.ts`
- **Related:** A previous model action-validation failure was hidden by the same generic catch path (`memory/2026-08-11-nex-calendar-action-validation.md`).
- **Status:** DONE
