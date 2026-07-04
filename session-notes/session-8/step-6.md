# Session 8 (v8) — Step 6: `vacationRoutes.ts` + mount in `server.ts`

## What was built

- `backend/src/api/routes/vacationRoutes.ts` (new) — blanket `authMiddleware`, then
  `POST /vacations`, `GET /vacations`, `GET /vacations/:id`, `POST /vacations/:id/trips`,
  mirroring `tripRoutes.ts`'s structure exactly.
- `backend/src/server.ts` — imported and mounted `vacationRoutes` at `/api`, after `tripRoutes`.

## Why these decisions

- Own dedicated route file (not appended to `tripRoutes.ts`) — matches the established
  one-file-per-resource convention (`healthRoutes`/`authRoutes`/`tripRoutes`), even though
  vacations and trips are closely related.
- Mounted after `tripRoutes`, though the order doesn't functionally matter since
  `vacationRoutes` has its own blanket `authMiddleware` rather than depending on anything from
  `tripRoutes` — it just needs to come after `authRoutes` (already true), following the
  mount-order lesson noted from a v7 bug.

## Verification

`npm run typecheck --prefix backend` clean, `npm test --prefix backend` — 42/42 passing. Full
route wiring is now in place — Step 7 is the checkpoint where these endpoints get curl-tested
end-to-end.

## Suggested commit title

`feat: add vacation routes and mount in server`
