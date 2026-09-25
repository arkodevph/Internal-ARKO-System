# Public NEX mobile keyboard layout

## Debug report

- **Symptom:** Opening the mobile keyboard pushed the floating public NEX terminal too high on screen.
- **Root cause:** The mobile shell reserved 5rem for bottom navigation while the panel added another 4.5rem above its trigger. Those offsets remained active after the keyboard reduced the viewport.
- **Fix:** While the public chat input is focused on mobile, collapse the stacked offsets, cap the panel against the reduced dynamic viewport, and hide the redundant launcher trigger. Desktop and keyboard-closed layouts are unchanged.
- **Evidence:** Diff validation passes and the complete web Jest suite passes: 40 suites / 352 tests.
- **Status:** DONE_WITH_CONCERNS — automated browser tooling is not installed, so final keyboard behavior needs confirmation on a physical mobile browser.
