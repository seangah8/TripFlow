# Session 4 (v4) — Step 3: `placeService.ts` — interest-driven queries

## What was built

`backend/src/api/services/placeService.ts`:
- `INTEREST_QUERY_PHRASES` — maps each interest to a textQuery phrase (museums, food, nature,
  nightlife, shopping).
- `BASELINE_QUERY_PHRASE` (`tourist attractions in {city}`) — today's existing broad query,
  always included so major landmarks stay visible no matter which interests are picked.
- `buildSearchQueries(city, interests)` — pure, exported function: baseline + one phrase per
  selected interest, city interpolated in. Zero interests → a single-element array identical to
  today's query.
- `fetchSearchTextPage` now takes a raw `queryText` instead of building one from `city` internally
  — reused across every query in the list.
- New `collectPlacesForQuery(queryText, apiKey, targetCount)` — the pagination do-while loop
  extracted unchanged from the old `fetchAndUpsertPlaces`, now reusable per query.
- `fetchAndUpsertPlaces(city, targetCount, interests)` — builds the query list, splits
  `targetCount` evenly across however many queries are active (`Math.ceil`), runs each
  sequentially, merges results, **dedupes by Google place id** before upserting (a place can
  legitimately surface from more than one query — e.g. a famous museum showing up in both the
  baseline and the "museums" query — and Postgres's upsert can't affect the same row twice in one
  statement), then continues into the existing filter/slice/upsert/re-query logic unchanged.

## Why these decisions

- Queries run **sequentially**, not in parallel — matches the existing pagination loop's style and
  avoids concurrent-request rate-limit risk against Google's API for a low-traffic dev tool.
- Dedup happens **before** the existing `.slice(0, targetCount)` — so the final count reflects
  actual distinct places, not inflated by cross-query duplicates.
- `interests` defaults to `[]` so `fetchAndUpsertPlaces`'s signature stays backward-compatible —
  `tripService.ts` isn't wired to pass it yet (that's Step 5); calling it today behaves exactly
  like before.
- `buildSearchQueries` kept pure and exported specifically so Step 4 can unit test the
  query-list-building and distribution logic without hitting the network.

**Suggested commit title:** `feat: drive Google Places queries from selected interests`
