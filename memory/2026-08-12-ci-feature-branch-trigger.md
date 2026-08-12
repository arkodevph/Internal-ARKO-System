# CI missing for feature branch pushes

## Symptom

No GitHub Actions run appeared after pushing `feat/vertex-ai-assistant`.

## Root cause

The CI workflow restricted `push` events to `main`. Feature branch pushes therefore did not match any workflow trigger unless a pull request targeting `main` already existed.

## Fix

- Run CI for pushes to every branch.
- Keep pull-request validation for changes targeting `main`.
- Add `workflow_dispatch` so CI can also be started manually.

## Verification

The workflow parses successfully and a push containing this change creates a branch CI run.
