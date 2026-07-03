# Session 6 (v6) — Step 1: `claudeService.ts` — richer curation schema, prompt, return type

## What was built

- `backend/src/types/claudeCuration.ts` — added `ClaudeCuratedStop` (Claude's raw per-place
  response shape: `googlePlaceId`, `estimatedMinutes`, `reasoning`) and `CuratedStop` (a real
  `Place` paired with those two fields — what `claudeService.ts` hands back to `tripService.ts`).
  `CurationOutput.selectedPlaceIds: string[]` → `CurationOutput.selectedPlaces: ClaudeCuratedStop[]`.
- `backend/src/api/services/claudeService.ts`:
  - `CURATION_SCHEMA` now asks for `selectedPlaces: { googlePlaceId, estimatedMinutes, reasoning }[]`
    instead of bare `selectedPlaceIds: string[]` — `estimatedMinutes` bounded `minimum: 15,
    maximum: 240, multipleOf: 15`; `reasoning` bounded `maxLength: 300`.
  - `extractSelectedPlaceIds` renamed to `extractSelectedPlaces`, returns `ClaudeCuratedStop[]`.
    Beyond the existing `stop_reason`/JSON-parse/shape checks, it now also defensively
    normalizes each entry in code: clamps `estimatedMinutes` into `[15, 240]` and rounds to the
    nearest multiple of 15, and truncates `reasoning` to 300 characters — rather than trusting
    the request schema's `minimum`/`maximum`/`multipleOf`/`maxLength` to be server-enforced.
  - `filterToKnownPlaces` renamed to `filterToKnownStops`, now returns `CuratedStop[]` instead
    of `Place[]` — still only trusts the *known* `places` array (never Claude's ids directly),
    preserves input order, and dedupes, unchanged from before.
  - `curatePlaces` return type is now `Promise<CuratedStop[]>` (was `Promise<Place[]>`).
  - `MAX_OUTPUT_TOKENS` raised `4096` → `8192` — a 300-char reasoning string alone is ~75
    tokens, so the old ceiling risked `max_tokens` truncation on a larger curated pool.
  - `CURATION_SYSTEM_PROMPT`'s closing paragraph rewritten to ask for the full per-place object
    (id + time estimate + reasoning) instead of just an id.

## Why these decisions

- The hallucination guard's design is unchanged in spirit — `filterToKnownStops` still filters
  the *known* input `Place[]` down to whichever ids Claude returned, so a fabricated/mistyped
  id simply matches nothing, exactly as `filterToKnownPlaces` did before.
- `clustering.ts` is deliberately left untouched — it stays a pure `Place[]`-in/`Place[]`-out
  function. `curatePlaces` now returns places bundled with their per-stop details; Step 3
  splits them back into a plain `Place[]` for clustering and re-attaches the details afterward
  via a lookup map, so clustering's contract never has to change.
- Defensive bounds-normalization in `extractSelectedPlaces` (clamp + round, not reject) exists
  because Anthropic's `json_schema` structured-output enforcement of numeric/string bounds
  isn't guaranteed the same way `type`/`required` are — and losing a whole place over a
  borderline value (e.g. `estimatedMinutes: 245`) is a worse outcome than adjusting it to 240.

## Verification

`npm run typecheck --prefix backend` shows the expected ripple errors in `tripService.ts`
(still on the old `curatePlaces` → `Place[]` contract) and `claudeService.test.ts` (still
referencing `extractSelectedPlaceIds`/`filterToKnownPlaces`/the old field names) — both are
Steps 2 and 3, not regressions introduced by this step.

## Suggested commit title

`feat: have claudeService.ts return per-stop estimatedMinutes and reasoning`
