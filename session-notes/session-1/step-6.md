# Session 1 (v1) — Step 6: Frontend: useGeneratePlaces hook

## What was built
`frontend/src/hooks/useGeneratePlaces.ts` — a TanStack Query `useMutation` wrapping `POST /api/places/generate`, taking a `city` string and resolving to `Place[]`.

## Why these decisions
- `useMutation` instead of `useQuery` — this is a POST that fires on demand (clicking Generate) and causes a side effect (Google Places fetch + DB upsert), not a GET that should load automatically on mount and get cached by a query key.
- Kept the same `URL` + `URLSearchParams`-style request-building convention the old `usePlaces.ts` used, so the pattern stays consistent even though that file is gone.
- Return type left as `Promise<Place[]>` from `response.json()` — no runtime validation of the response shape, matching the level of trust the rest of the app currently places in its own backend responses.

## Suggested commit title
`feat: add useGeneratePlaces mutation hook`
