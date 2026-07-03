# Session 4 (v4) — Step 2: `types/trip.ts` — `preferences` on `TripGenerateRequest`

## What was built

`backend/src/types/trip.ts` — `TripGenerateRequest` gains a required `preferences: TripPreferences`
field. `TripPreferences` already existed in this file (added ahead of need during an earlier
session, matching `BLUE_PRINT.md` Section 3's shape exactly: `vibe`, `interests[]`, `groupType`,
`budget`), so no new type had to be written — just wired into the request shape.

## Why these decisions

- `preferences` is required, not optional — the v4 wizard always collects it before Generate is
  reachable (Step 3 of the wizard has a Confirm button, not a skip). The `Trip.preferences` DB
  column stays nullable (unchanged, no migration needed) since old v2/v3 trips already have `null`
  there; only the API request contract tightens.

**Suggested commit title:** `feat: add preferences to TripGenerateRequest`
