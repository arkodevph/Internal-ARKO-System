# Marketing page transition debug report

- Symptom: Marketing route changes snapped and could reveal the outgoing page before the destination rendered.
- Root cause: The curtain crossed about 1.5 viewport widths in 220ms, and an 800ms fallback forced the reveal independently of the route state.
- Fix: Restored a 520ms eased diagonal wipe and made the route-change effect control the reveal. The timer is now only an 8-second failure escape.
- Evidence: Browser navigation from `/` to `/projects` remained covered until the destination route rendered; 336 tests and the production build passed.
- Regression coverage: Browser interaction and before/after screenshots; no component DOM test harness exists in the current Jest setup.
- Status: DONE.
