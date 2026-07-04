# Session 8 (v8) — Step 15: `App.tsx` routing

## What was built

`frontend/src/App.tsx` — added `/vacations/:vacationId` (`VacationPage`) and
`/vacations/:vacationId/trips/:tripId` (`TripPage`) to the authenticated routes block. The old
flat `/trips/:tripId` route was removed, not kept as a fallback, per the confirmed decision to
truncate pre-v8 trip data (Step 16) rather than support vacation-less trips in the UI.

## Why these decisions

- Routes added to the same authenticated `<Routes>` block as `/` (`DashboardPage`) — no new
  `ProtectedRoute` wrapper, consistent with the existing single `if (!user)` branch-swap pattern
  that gates the whole route tree at once.
- `/trips/:tripId` removed rather than dual-registered — this was the confirmed decision from
  planning: since pre-v8 dev data gets truncated in Step 16, there's no vacation-less trip left
  that would need the old flat route to remain reachable.

## Verification

`npm run typecheck --prefix frontend` clean. This completes all frontend code changes for v8 —
every component/page built in Steps 8–14 is now wired together end to end through routing. Full
browser verification is Step 16, after the pre-v8 data truncate.

## Suggested commit title

`feat: add nested vacation/trip routes, drop flat /trips/:tripId`
