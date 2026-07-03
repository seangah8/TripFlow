# Step 1: claudeService.ts — the curation call

## What was built

New file `backend/src/api/services/claudeService.ts` with `curatePlaces(places, preferences, totalDays, client?)` as the main export, plus supporting pieces: `buildUserPrompt` (pure, builds the prompt from a trimmed place summary + preferences + day count), `extractSelectedPlaceIds` (validates `stop_reason` and parses the structured-output JSON), `filterToKnownPlaces` (the hallucination guard), and a `ClaudeCurationError` class. Added `@anthropic-ai/sdk` (`^0.110.0`) as a backend dependency.

## Why each decision was made

- **`client` is injectable** (defaults to a real `Anthropic` instance reading `ANTHROPIC_API_KEY`) specifically so tests don't need to `jest.mock()` the SDK — a plain fake `{ messages: { create: jest.fn() } }` object works.
- **Structured-output schema is just `{ selectedPlaceIds: string[] }`** — nothing else. Per-stop reasoning/time estimates are v6 scope (already reserved as nullable `TripStop` columns), so Claude has no reason to return anything beyond which ids survive.
- **Prompt strips places down to `googlePlaceId`/`name`/`category`/`rating`/`lat`/`lng`** — `photoUrl`/`openingHours`/internal `id` cost tokens without helping a curation decision.
- **`thinking: { type: 'disabled' }` set explicitly** — Sonnet 5 defaults to adaptive thinking when `thinking` is omitted, but this is a bounded classification task sitting in the synchronous request path the user is waiting on, so predictable latency/cost won out over deeper reasoning here.
- **The hallucination guard never trusts Claude's ids directly** — `filterToKnownPlaces` filters the *known* input `places` array down to whichever ids survived, so a fabricated or mistyped `googlePlaceId` simply matches nothing rather than being trusted as a real place.
- **`ClaudeCurationError` is not specially caught anywhere** — it falls through to `tripController.ts`'s existing generic 500 handler, matching the confirmed session decision that a curation failure fails the whole trip-generation request rather than falling back to the uncurated pool.

## Verification

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: add claudeService.ts for AI-curated place selection`
