# Session 1 (v1) — Step 2: Backend: Place entity + Google Places response types

## What was built
- `backend/src/entities/Place.ts` — added a nullable `category` column.
- `backend/src/types/googlePlaces.ts` (new) — types for the `places:searchText` response: `GooglePlace`, `GooglePlaceText`, `GooglePlaceLocation`, `GooglePlacesSearchTextResponse`, scoped to exactly the fields we'll request.

## Why these decisions
- `category` is nullable and typed as `string | null` to match the rest of `Place`'s optional-field pattern (`rating`, `photoUrl`, `openingHours`) — TypeORM's `synchronize: true` picks up the new column automatically on next backend start, no migration needed at this stage.
- The Google response types only model the fields we're actually requesting (via field mask) — no speculative fields for photos or other data we're not fetching in v1.
- `regularOpeningHours` typed loosely as `Record<string, unknown>` rather than modeling Google's full nested schedule shape, since it's stored as-is in the `openingHours` jsonb column and not parsed until v8 — modeling it precisely now would be unused precision.

## Suggested commit title
`feat: add category column to Place and Google Places response types`
