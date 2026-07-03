---
name: test-ai-pipeline
description: Re-runs the full AI trip-generation pipeline (placeService -> claudeService -> tripService -> clustering) against a fixed real-world input to catch regressions whenever any of those files change.
---

# /test-ai-pipeline

Placeholder-style regression check for the AI pipeline: no mocks, no assertions — it runs the
real pipeline against a fixed city/date/preferences fixture and prints a human-readable
day-by-day itinerary so a person (or Claude Code) can eyeball whether it still looks right.

## Procedure

1. Run `npm run test:ai-pipeline --prefix backend`.
2. Read the full console output: the day-by-day stop list (name/rating/category per stop),
   the curated-vs-target totals, elapsed time, and any `console.warn` lines (these indicate the
   curation retry loop fired — see `backend/src/api/services/tripService.ts`).
3. Report the output back to the user. Flag anything that looks wrong rather than declaring
   success automatically: an empty or near-empty day, places that don't match the fixed
   preferences (interests: museums, food), a retry warning firing, or a thrown error/non-zero
   exit.

## What this does NOT do

- Does not mock the network — it calls the real Google Places API and the real Anthropic API,
  and costs real API usage on every run.
- Does not assert pass/fail programmatically. There is no expected-output fixture to diff
  against — this is a human-in-the-loop sanity check, not a CI gate.
- Does not clean up the `trips`/`trip_stops` rows it creates — the dev database is disposable
  (`synchronize: true`), so leftover rows are harmless.

## When to run it

Whenever a change touches any of: `backend/src/api/services/placeService.ts`,
`backend/src/api/services/claudeService.ts`, `backend/src/api/services/tripService.ts`,
`backend/src/utils/clustering.ts` — per `CLAUDE.md` Section 5.6.
