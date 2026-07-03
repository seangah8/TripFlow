# Session 2 (v2) — Step 7: Frontend types/trip.ts + useGenerateTrip hook

## What was built
- `frontend/src/types/trip.ts` (new) — `TripStop`, `TripDay`, `Trip` interfaces mirroring the backend's `TripStopResponse`/`TripDayResponse`/`TripGenerateResponse` (`backend/src/types/trip.ts`), reusing the existing `Place` type for each stop's `place` field.
- `frontend/src/hooks/useGenerateTrip.ts` (new) — `GenerateTripInput { city, startDate, endDate }`, a TanStack Query mutation wrapping `POST /api/trips/generate`, same shape/error-handling pattern as the existing `useGeneratePlaces.ts`.

## Why these decisions
- `useGeneratePlaces.ts` is **not deleted yet**, even though the plan's Step 7 description mentioned it — `TripPage.tsx`/`CityForm.tsx` still call it, and this session has kept every intermediate step type-checking cleanly (same reasoning as Step 2 defaulting `targetCount` instead of updating `placeController.ts` immediately). The actual deletion happens in Step 10, once `TripPage.tsx` is rewired to `useGenerateTrip`/`TripForm` and the old hook becomes genuinely unused.
- `tsc -b` passes for the frontend — these are pure additions, nothing existing was touched yet.

## Suggested commit title
`feat: add frontend Trip types and useGenerateTrip mutation hook`
