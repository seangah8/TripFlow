# Session 6 (v6) — Post-implementation fix: populate and render place photos

## What happened

You noticed every map pin and the detail panel showed the generic fallback icon, never a real
photo. Root cause: `placeService.ts`'s Google Places field mask never requested `places.photos`
— `Place.photoUrl` had been `null` for every place fetched since v1. This predates v6; v6 was
just the first version to ever try to use that column.

Fixing it properly raised a security question: Google's Places API doesn't return a direct
image URL, only a photo *resource name* that must be exchanged for the actual image via a media
endpoint requiring an API key. Baking the backend's secret `GOOGLE_PLACES_API_KEY` into that URL
and sending it in every API response would leak a key meant to stay server-side.

## What was built

**Backend:**
- `backend/src/types/googlePlaces.ts` — added `GooglePlacePhoto { name: string }` and a
  `photos?: GooglePlacePhoto[]` field on `GooglePlace`.
- `backend/src/api/services/placeService.ts` — added `places.photos` to `FIELD_MASK`; maps
  `photoName: googlePlace.photos?.[0]?.name ?? null` (first photo only) into each upserted row.
- `backend/src/entities/Place.ts` — renamed the `photoUrl` column to `photoName`, with a comment
  clarifying it's a resource name, not a URL.
- Updated all backend references (`claudeService.ts`'s prompt-trimming comment, both test
  fixture files) from `photoUrl` to `photoName`.

**Frontend:**
- `frontend/src/utils/placePhoto.ts` (new) — `buildPlacePhotoUrl(photoName, maxWidthPx?)`
  constructs the actual media URL using `VITE_GOOGLE_MAPS_API_KEY` (already public via the Maps
  JavaScript SDK's script tag) — the backend's secret key never reaches the browser.
- `frontend/src/components/NoPhotoIcon.tsx` (new) — the fallback "no photo" glyph, extracted
  into its own component since it's now used in two places (the pin and the detail panel).
- `frontend/src/types/place.ts` — `photoUrl` → `photoName`.
- `frontend/src/components/PlacePin.tsx` — takes `photoName`, builds the real image URL via
  `buildPlacePhotoUrl`, uses `<NoPhotoIcon>` for the fallback.
- `frontend/src/components/PlacesMap.tsx` — passes `photoName` instead of `photoUrl`.
- `frontend/src/components/StopDetailPanel.tsx` + `StopDetailPanel.scss` — added a photo (or
  `NoPhotoIcon` fallback) above the name/category, per your request while fixing this.

## Why these decisions

Storing the Google photo *resource name* (not a URL) and letting the **frontend** build the
actual media URL with its own already-public Maps key keeps the backend's Places API key secret
— it's never embedded in any API response the browser can see. The alternative (a backend proxy
endpoint that fetches the image itself) would be more airtight but adds a new route and makes
every photo request round-trip through our own server instead of hitting Google directly; you
chose the simpler approach given the frontend key's exposure is already an accepted tradeoff for
the Maps JS SDK.

## Verification

`npm run typecheck --prefix backend`/`--prefix frontend` and `npm test --prefix backend`
(42/42) all clean. Ran `/test-ai-pipeline` against the real stack and confirmed via a direct DB
query that `photo_name` is now populated with real Google resource names (e.g.
`places/ChIJ.../photos/AaVGc3n...`). Confirmed the full chain works by curling the constructed
media URL directly: `200 image/jpeg`.

## Follow-up: photos still didn't render — a Google Cloud key-permission issue, not code

After this fix, `photo_name` was confirmed populated in the DB, but photos still showed the
fallback icon (pins) or a broken-image glyph (panel). Diagnosed by curling the constructed
media URL with both keys directly:
- Backend's `GOOGLE_PLACES_API_KEY` → `200 image/jpeg` (works).
- Frontend's `VITE_GOOGLE_MAPS_API_KEY` → `403 API_KEY_SERVICE_BLOCKED` (Places API (New) isn't
  in that key's allowed API list in Google Cloud Console — it's presumably restricted to just
  the Maps JavaScript API).

This is a Google Cloud Console configuration issue on your project, not a code bug — you'll need
to add "Places API (New)" to the frontend key's API restrictions (APIs & Services → Credentials
→ that key → API restrictions) for the photo media endpoint to work from the browser.

## Follow-up: photo position in the detail panel

Per your feedback, moved the photo (or fallback) from the top of `StopDetailPanel` to the end —
after the reasoning paragraph, not before the name. Swapped `margin-bottom` for `margin-top` on
`.stop-detail-panel__photo`/`.stop-detail-panel__photo-fallback` in `StopDetailPanel.scss` to
match.

## Verification

`npm run typecheck --prefix frontend` clean after the reorder.

**Still outstanding:** once you've added Places API (New) to the frontend key's restrictions in
Google Cloud Console, refresh the app and confirm photo pins and the detail panel photo render
correctly (existing places in your dev DB from before the `photoName` fix will still show
`photo_name: null` until you generate a fresh trip — expected, not a bug).

## Suggested commit title

`fix: fetch and render real place photos via photoName, not a leaked API key`
`fix: move stop detail panel photo to the end, after reasoning`
