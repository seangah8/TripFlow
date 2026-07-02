# Session 1 (v1) — Step 3: Backend: placesService.ts — fetchAndUpsertPlaces

## What was built
Replaced `getPlacesByCity` with `fetchAndUpsertPlaces(city: string): Promise<Place[]>` — calls Google Places API (New) `searchText`, maps the response onto `Place` rows, upserts on `googlePlaceId`, and returns exactly the set just upserted.

## Why these decisions
- **Field mask** requests only `id, displayName, location, rating, regularOpeningHours, primaryTypeDisplayName` — no photo fields, matching the "skip photos in v1" decision and keeping the request in a cheaper Google billing tier.
- **Query text**: `"tourist attractions in {city}"`, broad and unfiltered — interest-based filtering is v4's job, not v1's.
- **`maxResultCount: 20`** set explicitly rather than relying on Google's default, so the ~20-places target from the blueprint is intentional in the code, not incidental.
- **API key check**: fails fast with a clear error if `GOOGLE_PLACES_API_KEY` isn't set, rather than silently sending a request Google would reject with a less obvious 403.
- **Return value**: re-queries by the exact `googlePlaceId`s just upserted, not the whole city catalog — keeps the response scoped to this specific fetch (matters more once v2 starts varying queries across repeated generates for the same city).

## Note
`placesController.ts` still imports the now-deleted `getPlacesByCity` at the end of this step, so backend typecheck fails until Step 4 updates it — expected mid-step state, not a regression.

## Bugfixes applied within this step
- **`upsert` type error** (`_QueryDeepPartialEntity<Place>` mismatch on `openingHours`): TypeORM's `QueryDeepPartialEntity<T>` recurses into object-typed columns, and can't cleanly map a jsonb column typed as `Record<string, unknown>` (the value type `unknown` doesn't survive that recursion). Fixed with an explicit cast — `rows as QueryDeepPartialEntity<Place>[]` — at the `upsert` call site.
- **`moduleResolution=node10` deprecation warning**: initially tried silencing it with `"ignoreDeprecations"`, but the accepted value differs by TypeScript version (CLI's local 5.9.3 wanted `"5.0"`, VSCode's bundled TS server wanted `"6.0"`) — a moving target, not a real fix. Migrated `backend/tsconfig.json` instead: `"module"`/`"moduleResolution"` → `"NodeNext"`, plus `"isolatedModules": true`, matching the convention CLAUDE.md already documents for this project. This surfaced one knock-on error — `Trip.ts` imported `TripPreferences` as a regular import even though it's only used in a decorated property signature (`preferences!: TripPreferences`), which `isolatedModules` + `emitDecoratorMetadata` requires to be `import type`. Fixed by changing that one import. `npm run dev` is unaffected — `tsx`/esbuild's runtime transpilation doesn't depend on tsconfig's `module`/`moduleResolution`, only `tsc --noEmit` (typecheck) does.

## Suggested commit title
`feat: replace getPlacesByCity with fetchAndUpsertPlaces`
