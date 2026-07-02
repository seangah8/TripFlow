# Session 1 (v1) — Step 5: Frontend: remove v0 places flow

## What was built
- Deleted `frontend/src/hooks/usePlaces.ts`.
- `frontend/src/types/place.ts` — added the `category` field to match the backend `Place` entity.
- `frontend/src/App.tsx` — stripped the v0 list-rendering (`usePlaces('Paris')` → `<ul>`), replaced with a minimal placeholder until Step 9 composes the real `CityForm` + `PlacesMap` view.

## Why these decisions
- Removing `usePlaces.ts` outright (per earlier decision) rather than leaving it unused — nothing in v1's UI needs a "fetch already-saved places for a city" read, and dead code just adds clutter.
- `place.ts` kept and updated rather than deleted — the type is still needed by the new generate flow, just with one more field (`category`).
- `App.tsx` placeholder is intentionally bare rather than a partial mashup of old and new UI, since the real composition depends on hooks/components that don't exist until Steps 6–8.

## Suggested commit title
`refactor: remove v0 places list flow`
