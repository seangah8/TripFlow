# Session 7 (v7) — Step 15: Google Maps export

## What was built

- `frontend/src/utils/googleMapsExport.ts` (new) — pure
  `buildGoogleMapsDirectionsUrl(stops: TripStop[]): string`, joining each stop's
  `place.lat,place.lng` into Google Maps' `/maps/dir/lat1,lng1/lat2,lng2/...` URL format.
- `frontend/src/pages/TripPage.tsx` — added an "Open in Google Maps" link in the header, built
  from the already-derived `currentDayStops`, opening in a new tab
  (`target="_blank" rel="noreferrer"`). Only rendered when the current day actually has stops.
- `frontend/src/styles/TripPage.scss` — small `.trip-page__maps-export` rule (pushes the link to
  the right of the header, blue to match the app's link/accent color).

## Why these decisions

- No backend involvement at all — this is pure string formatting from data `TripPage` already
  has in hand (`currentDayStops`), so a network round trip would add latency for zero benefit.
  Per the confirmed decision, this is a deliberate divergence from `BLUE_PRINT.md`'s literal
  "Backend" placement, to be corrected via `/sync-blueprint` at session end.
- Reused `currentDayStops` (not a new derived value) — it's already exactly "today's plan," the
  same slice the map and stop list both render from.

## Verification

`npm run typecheck --prefix frontend` clean; `npm run build` succeeds.

**Still outstanding (per this project's rule against self-testing UI in a browser):** please
open a trip, confirm the link appears once a day has stops, and click it to verify it opens a
correct multi-stop Google Maps directions URL in a new tab.

## Suggested commit title

`feat: add Google Maps export link to TripPage`
