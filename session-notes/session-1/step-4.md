# Session 1 (v1) — Step 4: Backend: controller + route — POST /places/generate

## What was built
- `placesController.ts` — replaced `getPlaces` with `generatePlaces`: validates `{ city }` from the request body, calls `fetchAndUpsertPlaces`, returns the resulting `Place[]`.
- `placesRoutes.ts` — replaced `GET /places` with `POST /places/generate`.
- `server.ts` — added `express.json()` middleware, needed now that a route reads a JSON request body (v0 had none).

## Why these decisions
- `city` comes from `req.body`, not a query string — this is a POST that triggers a live Google Places fetch, not a GET that reads existing data, so a body matches the semantics.
- Validation trims and checks for a non-empty string, mirroring the old `getPlaces` validation style but adapted to `req.body`.
- Error handling follows the same try/catch → `console.error` + 500 pattern already established elsewhere in the codebase.

## Suggested commit title
`feat: add POST /places/generate endpoint`
