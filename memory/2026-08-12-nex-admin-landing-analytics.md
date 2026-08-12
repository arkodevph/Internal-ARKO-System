# NEX admin landing analytics

## Symptom

An authenticated admin asked NEX to summarize landing-page analytics. NEX said the information was unavailable even though the dashboard displays landing traffic.

## Root cause

The assistant system prompt listed Analytics as a supported ARKO feature, but the authenticated chat route did not load landing traffic or include it in `AssistantContext`. The model therefore correctly refused to invent missing metrics.

## Fix

- Load existing aggregate landing traffic statistics for `ADMIN` sessions only.
- Supply totals, today, seven-day comparison, 30-day history, and last-viewed time to NEX.
- Tell NEX that the values are visit counts rather than unique visitors and link summaries to `/dashboard`.
- Keep the analytics context absent for every non-admin role.

## Verification

- Route test proves admins receive the aggregate analytics context.
- Existing role test proves non-admin sessions do not query or receive it.
