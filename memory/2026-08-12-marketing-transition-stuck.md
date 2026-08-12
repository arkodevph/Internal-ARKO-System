# Marketing transition stuck curtain

## Symptom

The acid-green page-transition curtain could cover the marketing page for several seconds and look frozen.

## Root cause

The route-completion safety timeout had been increased from 800 ms to 8,000 ms. If the pathname completion effect was delayed or did not run, the curtain intentionally stayed in its covered phase for eight seconds.

## Fix

- Restore a short 900 ms fallback release.
- Start route navigation as the covering animation begins instead of waiting for it to finish.
- Reveal only after both the destination route and covering animation are complete.
- Add a regression test limiting the curtain watchdog to one second.

## Verification

- Transition regression test passes.
- Full web test suite and production build pass.
- Browser navigation confirms the curtain becomes non-interactive and leaves the viewport after navigation.
