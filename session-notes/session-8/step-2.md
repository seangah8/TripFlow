# Session 8 (v8) — Step 2: `backend/src/types/vacation.ts`

## What was built

New file with three types:
- `VacationCreateRequest` — `{ name?: string }`, body for `POST /api/vacations`.
- `VacationAddTripRequest` — a type alias for the existing `TripGenerateRequest`, body for
  `POST /api/vacations/:id/trips`.
- `VacationResponse` — `{ vacationId, name, createdAt, trips: TripSummaryResponse[] }`, reused
  across create/list/detail responses.

## Why these decisions

- `VacationAddTripRequest` is a type alias, not a duplicate interface — the request body for
  adding a city to a vacation is byte-for-byte identical to the existing trip-generate body, so
  aliasing avoids two interfaces drifting out of sync as fields are added later.
- `VacationResponse` reuses the existing `TripSummaryResponse` for its `trips` array rather than
  the full `TripGenerateResponse` — the vacation hub only ever needs to render trip cards (city +
  dates), matching the exact reasoning `listTripsByOwner` already used for the dashboard's trip
  cards. A trip's full itinerary is fetched separately via the existing, unchanged
  `GET /api/trips/:id` when a card is clicked.
- One response shape is reused across create/list/detail (create just returns `trips: []`),
  mirroring how `TripGenerateResponse` is already shared between `generateTrip` and
  `getTripById`.

## Verification

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: add vacation request/response types`
