# Session 4 (v4) — Bug fix after Step 12: interest queries getting crowded out by baseline

## What happened

After the wizard was fully wired end to end (Step 12), you tested it for real: Tel Aviv, 5 days,
`interests: ["nightlife"]` only. The generated trip came back mostly museums/tourist attractions
with just one nightlife venue — the opposite of what picking "Nightlife" should do.

## Root cause

`backend/src/api/services/placeService.ts`'s `fetchAndUpsertPlaces`: `perQueryTarget` (the
even-split-per-query number, e.g. 13 for a 25-place target across baseline+nightlife) was only
used inside `collectPlacesForQuery` as a "stop paginating once you have at least this many"
threshold — not as a hard cap on what each query contributes. Since Google returns up to 20
places on a single page regardless of that threshold, and 20 already exceeds 13, the loop stopped
after page 1 and returned the *entire* page — often ~20 places, not 13. The baseline query always
runs first, so its uncapped ~20 results filled almost the entire merged list before the nightlife
query's results were even appended, and the final `.slice(0, targetCount)` — which just keeps
whatever's at the front — kept almost all baseline and cut off almost all nightlife.

## Fix

`fetchAndUpsertPlaces` now slices each query's own results down to `targetPerQuery` immediately
after collecting them, before pushing into the shared `collected` array — so every query
(baseline included) contributes at most its fair share, regardless of how many raw results Google
returned on the first page.

## Verification

Ran the real backend against Postgres + Google Places (not just typecheck) with the exact
scenario you hit: Tel Aviv, 5 days, `interests: ["nightlife"]`. Before the fix this was the bug;
after the fix, the 25 returned places split roughly evenly — 11 nightlife-category places (Bar,
Cocktail Bar, Wine Bar, Night Club, Beer Garden) and 14 baseline-category places (Tourist
Attraction, Museum, Cultural Center, Sports Club) — instead of 1 nightlife place total.

`npm run typecheck --prefix backend` and `npm test --prefix backend` (16/16) both still pass —
existing `placeService.test.ts` tests didn't need changes since they test `buildSearchQueries`/
`perQueryTarget` directly, not this application-level bug.

**Suggested commit title:** `fix: cap each interest query's contribution before merging, so baseline can't crowd out interest-specific results`
