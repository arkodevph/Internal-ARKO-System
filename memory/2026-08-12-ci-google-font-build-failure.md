# CI Google Font build failure

## Symptom

GitHub Actions failed inside `next/font` because it could not download Figtree font files from `fonts.gstatic.com`.

## Root cause

The root layout used four `next/font/google` families, making compilation depend on Google Fonts being reachable. Global CSS also imported four Google families at runtime.

## Fix

- Remove all build-time `next/font/google` usage.
- Remove the runtime Google Fonts stylesheet import.
- Preserve the existing typography variables with system font stacks.

## Verification

- The repository contains no Google font imports.
- Root `pnpm build` completes without downloading fonts.
- Full web tests pass.
