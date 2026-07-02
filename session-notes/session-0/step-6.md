# Session 0 — Step 6: Seed script

## What was built
- `backend/src/seeds/seed.ts` — initializes the DataSource, upserts one `Place` row (Eiffel Tower, Paris, lat `48.8584`, lng `2.2945`, `googlePlaceId: 'placeholder-eiffel-tower'`) keyed on `googlePlaceId`, then closes the connection. Wired to `npm run seed`.
- Verified: ran it twice — second run doesn't create a duplicate row (confirmed via `GET /api/places?city=Paris`, still exactly 1 match). Confirmed `lat`/`lng` return as real JSON numbers, not strings.

## Why these decisions were made
- Used `.upsert(..., ['googlePlaceId'])` rather than a plain `.save()`/`.insert()` — matches `BLUE_PRINT.md` Section 5's stated dedup strategy ("upsert into the `places` table using `googlePlaceId` as the dedup key"), so re-running the seed script is always safe.
- `googlePlaceId: 'placeholder-eiffel-tower'` is an obviously-fake ID, not a real Google Places ID — Session 0 has no Google Places integration yet, and using a real-looking ID could be confused later for actual API data.
- No `rating`/`photoUrl`/`openingHours` set — they're nullable, and Session 0's only requirement is one visible place name; inventing fake values for those would be guessing at data we'll actually get from Google Places in Session 1.

## Suggested commit title
`feat(backend): add seed script for placeholder Eiffel Tower place`
