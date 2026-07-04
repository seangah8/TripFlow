# Session 7 (v7) — Step 1: `User` entity + `Trip.ownerId`

## What was built

- `backend/src/entities/User.ts` (new) — `id` (uuid PK), `email` (unique varchar),
  `passwordHash` (varchar), `createdAt`. Explicit `@Column` types throughout, per this repo's
  esbuild/decorator-metadata rule.
- `backend/src/entities/Trip.ts` — removed the "no owner column yet" comment; added
  `ownerId!: string` (`@Column('uuid')`) and `owner!: User`
  (`@ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'owner_id' })`),
  mirroring `TripStop.trip`'s existing FK pattern exactly.
- `backend/src/config/data-source.ts` — registered `User` in the entities array.

## Why these decisions

- `ownerId` is a required (not nullable) column from the start — per the confirmed decision to
  wipe dev data rather than carry a defensive-nullable column forward.
- `onDelete: 'CASCADE'` on `Trip.owner` — deleting a user cleans up their trips, consistent with
  `TripStop`'s existing cascade off `Trip`. There's no user-delete feature in v7 to actually
  exercise this, but it keeps the ownership chain's deletion semantics consistent end-to-end
  rather than leaving it as an unconsidered default.

## Verification

`npm run typecheck --prefix backend` is clean. TypeORM's `create()` uses a `DeepPartial` type,
so `tripService.ts`'s current `tripRepository.create({ city, startDate, endDate, preferences })`
call (missing `ownerId`) still compiles even though it would now fail at the database level —
expected, and fixed for real in Step 7.

**Action required from the user:** `Trip.ownerId` is now `NOT NULL`, but `synchronize: true`
can't add a `NOT NULL` column to non-empty tables. The user needs to run
`TRUNCATE trip_stops, trips;` in Postgres before the backend restarts — safe, since this is
disposable local dev data with no real users yet.

## Suggested commit title

`feat: add User entity and required Trip.ownerId FK`
