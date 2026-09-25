# Browser cache and media-buffer investigation

- Symptom: Brave renderer RAM grew to about 4.9 GB while viewing the landing page.
- Root cause: cache cleanup skipped Cache Storage when no service worker registration remained. The entry preloader also loaded `services.mp4` in a second video element without explicitly releasing its media buffer when dismissed.
- Fix: always clear Cache Storage during service-worker cleanup, and pause/unset/reload the preloader video before removing it.
- Evidence: `/services.mp4` already responds with `Cache-Control: public, max-age=0`, so static HTTP cache headers were not the stale-cache source. ESLint, TypeScript, and `git diff --check` pass after the change.
- Status: DONE_WITH_CONCERNS — browser-process memory depends on open tabs and extensions, so runtime RAM should still be checked in Brave Task Manager.
