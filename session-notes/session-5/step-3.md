# Step 3: Wire curation (with retry) into tripService.ts

## What was built

`generateTrip()` now runs a retry loop between the existing fetch and cluster steps: `computeFetchPoolSize(dayCount, attempt)` (pure, exported) computes the pre-curation Google fetch size, scaling with trip length and capping at 100 on the normal path, then escalating by +40 per retry past that cap. The loop fetches, curates via `curatePlaces`, and either breaks (curated count meets `targetPlaceCount`), retries with a bigger pool, or — after 3 total attempts — proceeds anyway with a `console.warn`. It also breaks early if a retry's fetch returns no additional candidates over the previous attempt (no point re-curating an unchanged pool).

## Why each decision was made

- **The "too small" floor is `targetPlaceCount` itself** (`Math.max(days.length * PLACES_PER_DAY_TARGET, MIN_PLACES_TARGET)`) — reuses the exact number the rest of the pipeline (and the original v2-v4 fetch, before v5) was already built around, rather than inventing a second, disconnected threshold. (Originally proposed as a 60%-of-target ratio; corrected during this session to the full target.)
- **Retry escalation is uncapped past `FETCH_POOL_MAX`** — the normal-path cap and the retry mechanism would otherwise contradict each other (a 14-day trip's attempt-0 pool is already at the 100 cap, leaving no room to grow under an unmodified formula).
- **A thrown error from `curatePlaces` is never caught by this loop** — it propagates immediately on any attempt, matching the earlier decision that a Claude failure fails the whole trip-generation request. The loop only reacts to a *successful* call whose output was too small.
- **3 total attempts (1 initial + 2 retries)** — each attempt costs a full Google pagination round plus a Claude call, so diminishing returns kick in fast; if two pool enlargements don't help, the city/preference combination genuinely doesn't have enough matching places.
- **`computeFetchPoolSize` is a pure, exported function** — same pattern as `placeService.ts`'s `perQueryTarget`, testable in isolation without DB/network mocking.

## Verification

`npm run typecheck --prefix backend` is clean. `npm test --prefix backend` — all 34 tests passing (18 `claudeService` tests + the existing `clustering`/`placeService` suites, confirming nothing regressed).

## Suggested commit title

`feat: wire Claude curation with retry-on-too-small into tripService.ts`
