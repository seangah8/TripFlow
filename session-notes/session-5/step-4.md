# Step 4: Unit tests for the new tripService.ts helpers

## What was built

`backend/src/tests/tripService.test.ts` — 5 tests for `computeFetchPoolSize(dayCount, attempt)`: the 60-place minimum for short trips, scaling at 10 places/day once that exceeds the minimum, the 100-place cap for long trips, and retry escalation (+40 per attempt) on top of both the short-trip minimum and the long-trip cap.

## Why each decision was made

- Only `computeFetchPoolSize` needed testing here — the earlier `computeMinAcceptableCuratedCount` helper was dropped during Step 3 (the "too small" floor is just `targetPlaceCount` directly, not a separate formula), so there's nothing else pure to test in isolation.
- The full retry loop inside `generateTrip` is intentionally not unit-tested — it's tightly coupled to the DB and two network calls (Google Places, Anthropic). That end-to-end behavior is what `/test-ai-pipeline` (Step 5) exercises instead, against the real stack.

## Verification

`npm run typecheck --prefix backend` is clean. `npm test --prefix backend` — all 39 tests passing (5 new + the existing 34).

## Suggested commit title

`test: add unit tests for tripService.ts's computeFetchPoolSize`
