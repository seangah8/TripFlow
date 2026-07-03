# Session 3 (v3) — Step 4: Wire `tripService.ts` to `clusterPlacesByDay`

## What was built

`backend/src/api/services/tripService.ts`:
- Added `import { clusterPlacesByDay } from '../../utils/clustering';`.
- Deleted the old `splitPlacesByDay` function (round-robin `i % totalDays` split) entirely.
- Changed the one call site in `generateTrip()`: `splitPlacesByDay(places, days)` → `clusterPlacesByDay(places, days)`.

Re-ran `npm run typecheck` and `npm test` — both clean, all 7 clustering tests still passing.

## Why each decision was made

- No other code in `generateTrip()` needed to change — `clusterPlacesByDay` was deliberately designed (Step 1) with the exact same signature and `Map<string, Place[]>` return shape as the function it replaces, so the `StopDraft[]` construction, `TripStop` insert, and response-building logic downstream are untouched. Minimal, low-risk diff for a meaningful behavior change.
- Deleted rather than kept-but-unused: `splitPlacesByDay` has no remaining callers and no reason to keep dead code around.

## Suggested commit title

`feat: replace random day-split with real K-means clustering in tripService`
