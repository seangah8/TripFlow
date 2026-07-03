# Session 2 (v2) — Step 3: Backend types/trip.ts — API contract types

## What was built
- `backend/src/types/trip.ts` gained four new interfaces:
  - `TripGenerateRequest` — `{ city, startDate, endDate }`, the v2 request body.
  - `TripStopResponse` — `{ tripStopId, order, place, estimatedMinutes, reasoning }`, one stop within a day.
  - `TripDayResponse` — `{ date, stops }`, one calendar day of the trip.
  - `TripGenerateResponse` — `{ tripId, city, startDate, endDate, days }`, the full response, matching BLUE_PRINT.md Section 5's contract shape.

## Why these decisions
- `TripStopResponse.place` is typed as the full `Place` entity (imported with `import type`, per this repo's `isolatedModules` requirement) rather than a hand-built subset DTO. BLUE_PRINT.md's example response shows a narrower place object (id, name, lat, lng, rating, category, photoUrl, openingHours), but `TripStop`'s `place` relation already loads a full `Place` row — introducing a separate mapping layer just to drop `googlePlaceId`/`city` from the response adds a translation step for no functional benefit at this stage. Flagging this as a deliberate, minor divergence from the contract's literal shape, not a silent one — happy to add a stricter DTO later if it matters (e.g. once auth means responses cross trust boundaries more explicitly).
- `estimatedMinutes`/`reasoning` are typed as `number | null` / `string | null` (not optional/undefined) — v2 will always explicitly set them to `null` rather than omitting them, keeping the response shape's keys stable across versions even before v6 populates them for real.

## Suggested commit title
`feat: add trip generation API contract types`
