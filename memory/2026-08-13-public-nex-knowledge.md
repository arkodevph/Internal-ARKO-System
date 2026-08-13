# Public NEX knowledge coverage

## Debug report

- **Symptom:** Public NEX returned its generic scope message for ordinary studio questions such as “Who is the dev?”
- **Root cause:** The public chat route used a small hard-coded keyword switch and did not read the public landing-page CMS content. Team, portfolio, technology, process, support, and blog questions had no matching knowledge path.
- **Fix:** The route now loads the existing public landing content and answers those additional public topics from that source. Authenticated workspace terms remain blocked. The accidental panel-width change was reverted.
- **Evidence:** A live local request for “Who is the dev behind ARKO?” returns the public studio/GitHub answer. The complete web Jest suite passes: 40 suites / 351 tests.
- **Regression test:** `apps/web/src/app/api/assistant/public-chat/__tests__/route.test.ts`
- **Related:** Public chat remains deterministic and scoped to ARKO; it does not use unrestricted model knowledge.
- **Status:** DONE
