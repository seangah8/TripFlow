# Session 6 (v6) — Step 5: `PlacesMap.tsx` + `PlacePin.tsx` — custom photo pins, click-to-select, pan-to-center

## What was built

- `frontend/src/components/PlacePin.tsx` (new) — a custom teardrop pin built with a CSS-only
  technique (a square rotated -45° with `border-radius: 50% 50% 50% 0`, one corner left sharp
  to form the point). Shows a circular crop of `place.photoUrl` (counter-rotated to stay
  upright) inset in the round top, or — when `photoUrl` is `null` — a generic "no photo"
  glyph (a simple image-placeholder icon) on a neutral background instead. A `selected` prop
  swaps the border/shadow color to the app's existing accent blue (`#2563eb`, already used for
  the selected day-timeline card).
- `frontend/src/styles/PlacePin.scss` (new) — the pin's shape, photo, fallback-icon, and
  selected-state styles.
- `frontend/src/components/PlacesMap.tsx`:
  - Switched from the legacy `Marker` to `AdvancedMarker` — required for rendering custom
    (non-icon-URL) marker content — which in turn requires `<Map>` to have a `mapId`.
  - Prop signature: `{ places: Place[] }` → `{ stops: TripStop[]; selectedStopId: string | null;
    onSelectStop: (id: string) => void }`.
  - Each stop renders an `<AdvancedMarker>` wrapping a `<PlacePin>`, with `onClick` calling
    `onSelectStop(stop.tripStopId)`.
  - New `PanToSelectedStop` helper component (same `useMap()` + `useEffect`-inside-`<Map>`-tree
    pattern as the existing `FitBoundsToPlaces`) — pans (never zooms) to the selected stop's
    marker.
  - `FitBoundsToPlaces` now reads `stops[i].place.lat/lng`, unchanged behavior otherwise.
  - `<APIProvider>` gains `libraries={['marker']}` to explicitly load the Advanced Markers
    library.
- `frontend/.env.example` — documented the new required `VITE_GOOGLE_MAPS_MAP_ID` env var
  (a Google Cloud Console Map ID, separate from the existing API key).
- `frontend/src/vite-env.d.ts` — added `VITE_GOOGLE_MAPS_MAP_ID` to `ImportMetaEnv` so it
  typechecks the same way `VITE_API_URL` already does.

## Why these decisions

- `PanToSelectedStop` is keyed on `selectedStopId` (not `stops`) specifically so it never
  conflicts with `FitBoundsToPlaces`: switching days always clears `selectedStopId` back to
  `null` first (wired in Step 9's `TripPage`), so the pan effect only ever fires from an
  explicit stop click — a day switch triggers `FitBoundsToPlaces` (keyed on `stops`) instead,
  never both at once.
- The photo/fallback-icon inside the pin is counter-rotated 45° to stay upright despite the
  container's -45° rotation — a standard technique for this teardrop-pin CSS trick.

## Verification

`npm run typecheck --prefix frontend` shows only the expected `TripPage.tsx` error (still
passing the old `places` prop to `PlacesMap`) — that's Step 9's job. `PlacesMap.tsx`/
`PlacePin.tsx` themselves typecheck clean in isolation.

**Still outstanding (per CLAUDE.md's rule against browser-testing UI changes myself):** you'll
need a `VITE_GOOGLE_MAPS_MAP_ID` set in `frontend/.env` before the photo pins can actually
render — please check in the browser once Step 9 wires everything together that pins show
photos (or the fallback icon), click-to-select works, and the map pans correctly.

## Suggested commit title

`feat: custom photo map pins with click-to-select and pan-to-center`
