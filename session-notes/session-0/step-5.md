# Session 0 — Step 5: Express app + routes

## What was built
- `backend/src/api/services/placesService.ts` — `getPlacesByCity(city)`, the only place that touches the `Place` repository.
- `backend/src/api/controllers/placesController.ts` — `getPlaces` handler: validates the `city` query param (400 if missing), calls the service, catches errors (500 on failure).
- `backend/src/api/routes/placesRoutes.ts` — `GET /places` → `getPlaces`.
- `backend/src/api/routes/healthRoutes.ts` — `GET /health` → `{ ok: true }`.
- `backend/src/server.ts` — boots Express, mounts both route files at `/api` directly (no aggregator), initializes the DataSource, then listens.
- **Bug fix along the way:** the dev server crashed on first boot with `ColumnTypeUndefinedError` — `tsx` (esbuild) doesn't reliably emit the decorator metadata TypeORM needs to infer column types from a bare `@Column()`. Fixed by making every column type explicit (`@Column('varchar')`, `@Column('uuid')`, `@Column('int')`, etc.) across all three entities (`Place`, `Trip`, `TripStop`). Documented as a permanent rule in `CLAUDE.md`'s TypeScript conventions.
- Verified live: `GET /api/health` → `{"ok":true}`, `GET /api/places?city=Paris` → `[]` (correct, no seed data yet), `GET /api/places` (no city) → `400`. `synchronize: true` created all three tables (`places`, `trip_stops`, `trips`) in Postgres, confirmed via `psql \dt`.

## Why these decisions were made
- Controller stays thin (validation + error handling only); the service is the only thing that talks to the DB — matches the routes → controllers → services → DB layering rule established during planning.
- Explicit column types aren't a style preference here — they're required for the app to boot at all under `tsx`/esbuild. Added to `CLAUDE.md` so this isn't missed again as new entities are added in later sessions.
- No `routes/index.ts` aggregator — `server.ts` imports `healthRoutes` and `placesRoutes` directly, per the earlier decision that two files don't need an indirection layer.

## Suggested commit title
`fix(backend): boot Express API and require explicit TypeORM column types for tsx`
