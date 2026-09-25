# System theme hydration mismatch

- Symptom: React reported that `data-system-theme="dark"` existed on the client but not in the server-rendered `<html>`.
- Root cause: the intentional pre-paint theme script reads local storage and mutates the root element before hydration. The server cannot know that browser-only preference.
- Fix: mark the root `<html>` with `suppressHydrationWarning`, scoped to the intentional attribute difference.
- Verification: lint and production build checks completed for the affected layout.
