# Public NEX guided choice pills

## Debug report

- **Symptom:** Vague inquiries produced a long scope explanation instead of helping visitors choose a useful topic.
- **Root cause:** The public chat response contract only carried text, so the UI had no contextual suggestion data to render.
- **Fix:** Vague and unknown public questions now return a short prompt plus guided choices. The floating assistant renders Services, Pricing, Portfolio, Process, and Start a project as animated pill buttons that submit the selected topic. Private-data refusals never include suggestions.
- **Evidence:** A live local request for “I want to inquire?” returns the short prompt and all five suggestions. The complete web Jest suite passes: 40 suites / 352 tests.
- **Regression test:** `apps/web/src/app/api/assistant/public-chat/__tests__/route.test.ts`
- **Status:** DONE
