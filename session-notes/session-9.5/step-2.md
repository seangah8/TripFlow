# Session 9.5 — Step 2: LLM-picked cover photo

## What was built (reworked mid-step — see "Why" below)
- `claudeService.ts`: `CURATION_SCHEMA` gains a top-level sibling field `iconicPlaceId: string` (not a per-place flag) — required alongside `selectedPlaces`. `CURATION_SYSTEM_PROMPT` instructs Claude to return, separately from the kept-places list, the exact `googlePlaceId` (from among the places it kept) of the single most iconic/photogenic/must-see stop for the whole trip.
- `extractSelectedPlaces` now returns `ExtractedCuration { stops: ClaudeCuratedStop[]; iconicPlaceId: string }` instead of a bare array; validates `iconicPlaceId` is present/a string as part of its existing schema-shape check.
- `filterToKnownStops` is unchanged from before Step 2 (still just `ClaudeCuratedStop[] + Place[] -> CuratedStop[]`, no iconic-related fields).
- `curatePlaces` now returns `CurationResult { stops: CuratedStop[]; coverPhotoName: string | null }` — it resolves `iconicPlaceId` against the *actually kept* stops (`stops.find(...)`, the same anti-hallucination principle as `filterToKnownStops`) and returns `null` if it doesn't match one of them.
- `types/claudeCuration.ts`: added `CurationOutput.iconicPlaceId`, `ExtractedCuration`, and `CurationResult`; `ClaudeCuratedStop`/`CuratedStop` stay exactly as they were pre-Step-2 (no `isIconic` field).
- `entities/Trip.ts`: new `photoName: string | null` column, resolved once in `generateTrip` and never recomputed afterward.
- `entities/TripStop.ts`: reverted — no `isIconic` column (removed after the redesign below).
- `tripService.ts`'s `generateTrip`: tracks `bestCoverPhotoName` alongside `bestCuratedStops` across retry attempts (so the cover photo always matches whichever attempt's stops actually won). `stopDrafts` is now built *before* the `Trip` row is created, so its first entry (already in (date, order) sequence) is available as the fallback when Claude's pick didn't resolve. The `Trip` row is created with `photoName` already resolved.
- Entirely **removed** `getFirstStopPhotoByTripId`/`getCoverPhotoByTripId` and its `TripStop`+`Place` join query. `listTripsByOwner` (`tripService.ts`), `listVacationsByOwner`, and `getVacationById` (`vacationService.ts`) now just read `trip.photoName` directly off already-fetched `Trip` rows — no extra query at all.
- `claudeService.test.ts` rewritten for the new shapes: `extractSelectedPlaces` tests assert on `.stops`/`.iconicPlaceId`; new tests cover `curatePlaces` resolving `coverPhotoName` to the iconic place's `photoName`, and resolving to `null` when `iconicPlaceId` doesn't match a kept stop (hallucination guard).
- `npm run typecheck --prefix backend` and `npm test --prefix backend` pass (50/50).

## Why this was reworked mid-step
Originally implemented as a per-stop `isIconic: boolean` column on `TripStop`, with a `keepFirstIconicOnly` normalizer to defend the "at most one true per trip" invariant in code. User pointed out this modeled a trip-level fact (which single place is the cover) as a per-row flag, which is the wrong shape for the data — a top-level `iconicPlaceId` field guarantees "at most one" structurally, with nothing to defend. This also enabled a bigger win: since the cover photo can now be resolved once at generation time and stored directly on `Trip`, the join query that recomputed it on every dashboard/vacation-hub load could be deleted entirely.

**Trade-off, named explicitly:** the cover photo freezes at generation time. If the underlying `Place.photoName` were ever to change via an unrelated later re-fetch, the trip's stored cover wouldn't update retroactively. This is consistent with the existing architecture decision that `trip_stops` (and now, by extension, the trip's cover) is the immutable source of truth for a generated plan.

## Outstanding
- `/test-ai-pipeline` reminder per CLAUDE.md §5.6 — not run yet (hits real Anthropic/Google APIs; left for the user given the project's API budget note).
- Browser verification outstanding per CLAUDE.md §5.2 — confirm a sensible cover photo shows up on a trip/vacation card after generating a real trip.

## Suggested commit title
`feat(curation): let Claude flag the trip's cover photo instead of using the first stop`
