# DEBUG REPORT — NEX calendar action validation

- **Symptom:** NEX handled ordinary conversation but returned “The assistant is temporarily unavailable” for “create a meeting tomorrow at 3pm.”
- **Root cause:** Production logs showed a `ZodError` on the proposed action's `date`. Vertex output passed the broad response envelope but did not match the narrower `YYYY-MM-DD` action validator; the thrown validation error was then converted to a generic HTTP 503.
- **Fix:** Constrain the structured-output date shape, normalize ISO timestamps to calendar dates, and safely reject malformed proposed actions with a useful clarification instead of throwing.
- **Evidence:** Production log entries at the reported time both failed at `date` validation. The focused assistant tests reproduce timestamp and malformed-date responses and now pass.
- **Regression test:** `apps/web/src/server/services/__tests__/assistant.test.ts`
- **Related:** The assistant previously needed a natural-language meeting scope fix (`f5b838c`). Model output remains untrusted and must always be validated at the service boundary.
- **Status:** DONE
