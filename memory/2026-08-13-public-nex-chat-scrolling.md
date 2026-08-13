# Public NEX chat scrolling

## Debug report

- **Symptom:** The floating marketing-site chat could not reliably scroll through a long conversation, and its progressive assistant response could grow below the visible viewport.
- **Root cause:** The scroll viewport wrapped messages in a `min-h-full` flex column with `justify-end`. Once content exceeded the viewport, end alignment could place older messages above the scroll origin. Auto-scroll also ran only when message/loading state changed, not while the progressive response changed height.
- **Fix:** Removed end alignment, constrained the flex scroll child with `min-h-0`, tracked whether the reader remains near the bottom, and used `ResizeObserver` to follow progressive response growth without pulling readers who scroll upward.
- **Evidence:** The dedicated scroll-position regression test passes, the local site responds, and the complete web Jest suite passes: 40 suites / 349 tests.
- **Regression test:** `apps/web/src/lib/__tests__/chat-scroll.test.ts`
- **Related:** The terminal redesign introduced the end-aligned flex wrapper in commit `7f98c23`.
- **Status:** DONE
