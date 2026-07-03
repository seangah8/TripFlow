# Step 2: Unit tests for claudeService.ts

## What was built

`backend/src/tests/claudeService.test.ts` — 18 tests covering `buildUserPrompt` (includes preferences/day-count, strips irrelevant fields), `extractSelectedPlaceIds` (happy path plus every failure mode: refusal, `max_tokens`, missing text block, invalid JSON, schema mismatch), `filterToKnownPlaces` (the hallucination guard in isolation, dedup, order preservation), and `curatePlaces` end-to-end (correct request shape sent to the client, a hallucinated id dropped from the result, error propagation for both a refusal and a raw network error).

## Why each decision was made

- Followed the existing `placeService.test.ts` convention — pure functions tested directly, no framework-level mocking machinery, `makePlace(...)` fixture helper matching `clustering.test.ts`'s style.
- `Anthropic.TextBlock` requires a `citations` field even though citations are irrelevant to structured-output responses — added a small `fakeTextBlock()` helper so every test constructs a type-correct block instead of repeating that boilerplate inline.
- Every failure path of `extractSelectedPlaceIds` gets its own test (refusal, truncation, missing text block, invalid JSON, schema mismatch) since this is the one place malformed Claude output could otherwise slip through as a silent bug.
- `curatePlaces`'s hallucination-guard test asserts on the *returned* `Place[]`, not just `filterToKnownPlaces` in isolation — confirms the guard is actually wired into the real call path, not just correct as a standalone function.

## Verification

`npm run typecheck --prefix backend` is clean. `npx jest src/tests/claudeService.test.ts` — 18/18 passing.

## Suggested commit title

`test: add unit tests for claudeService.ts`
