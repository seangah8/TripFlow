# Session 0 — Step 4: TypeORM DataSource + entities

## What was built
- `backend/src/utils/numericTransformer.ts` — converts Postgres decimal strings to JS numbers on read.
- `backend/src/types/trip.ts` — `TripPreferences` interface (domain-specific type file; future entity-related types get their own file the same way, e.g. `types/place.ts`).
- `backend/src/entities/Place.ts` — `id`, `googlePlaceId` (unique), `name`, `lat`/`lng` (`decimal(10,7)`), `city`, `rating` (`decimal(3,1)`, nullable), `photoUrl` (nullable), `openingHours` (`jsonb`, nullable).
- `backend/src/entities/Trip.ts` — `id`, `city`, `startDate`/`endDate` (`date`), `preferences` (`jsonb`, typed via `TripPreferences`), `createdAt`. No `owner` column.
- `backend/src/entities/TripStop.ts` — `id`, `tripId`/`trip` relation (cascade delete), `placeId`/`place` relation (no cascade), `date`, `order`, `estimatedMinutes`, `reasoning` (nullable text).
- `backend/src/config/data-source.ts` — Postgres `DataSource` using `SnakeNamingStrategy`, `synchronize: true`, loads `.env` via `dotenv`, registers all three entities directly (no glob paths).
- Verified with `npm run typecheck` — passes clean.

## Why these decisions were made
- Types are organized per-domain (`types/trip.ts`) rather than one flat `index.ts` — per your request to keep types as organized as possible; future entity-related types (e.g. Place-specific types in Session 1) get their own file the same way instead of piling into one barrel file.
- `TripStop` keeps both the relation (`trip`/`place`, for the real FK constraint + cascade behavior) and the plain `tripId`/`placeId` scalar columns (for reading the raw FK id without loading the relation) — this is what lets the cascade-delete-on-trip / no-cascade-on-place rule from `BLUE_PRINT.md` Section 3 actually get enforced by Postgres, not just implied by naming.
- `data-source.ts` references entity classes directly instead of glob path strings — avoids the classic TypeORM dev/build path-mismatch footgun with `tsx`.
- `openingHours` is typed as `Record<string, unknown> | null` rather than a precise Google Places response shape — we haven't integrated with that API yet (Session 1), so a precise type now would be guessing at a shape we haven't seen.

## Suggested commit title
`feat(backend): add TypeORM DataSource and Place/Trip/TripStop entities`
