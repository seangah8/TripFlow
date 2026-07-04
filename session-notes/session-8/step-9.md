# Session 8 (v8) — Step 9: Frontend hooks

## What was built

Four new hook files, mirroring `useTrip.ts`/`useTrips.ts`/`useGenerateTrip.ts`'s exact patterns:

- `useVacations.ts` — `useQuery({ queryKey: ['vacations'], queryFn: fetchVacations })`.
- `useVacation.ts` — `useQuery({ queryKey: ['vacation', vacationId], queryFn: () =>
  fetchVacation(vacationId!), enabled: Boolean(vacationId) })`.
- `useCreateVacation.ts` — mutation wrapping `createVacation`, invalidates `['vacations']` on
  success so the dashboard list picks up the new vacation without a manual refresh.
- `useAddTripToVacation.ts` — `useAddTripToVacation(vacationId)` mutation wrapping
  `addTripToVacation`, invalidates both `['vacation', vacationId]` (so the hub shows the new
  trip card) and `['vacations']` (so the dashboard's city-list fallback display stays current)
  on success.

## Why these decisions

- Every hook is a thin wrapper around the plain functions built in Step 8 — no fetch logic
  lives in the hooks themselves, matching the existing trip-hooks split.
- `useAddTripToVacation` invalidates two query keys, not one — a new trip affects both the
  vacation-detail view (adds a card) and the dashboard's vacation-list view (if unnamed, the
  card's fallback label is a joined city list that now needs to include the new city).

## Verification

`npm run typecheck --prefix frontend` clean. No runtime verification yet — nothing calls these
hooks until the components/pages built in Steps 10–13 use them.

## Suggested commit title

`feat: add vacation TanStack Query hooks`
