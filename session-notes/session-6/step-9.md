# Session 6 (v6) — Step 9: `TripPage.tsx` + `TripPage.scss` — wire the toggling list/detail column + map

## What changed from the original plan

The plan's original three-column design (stop list | stop detail panel | map, with the panel
always mounted showing a placeholder when nothing was selected) was replaced after your
feedback: you wanted the list and the detail to share **one** column, toggling between the two,
rather than living as two permanently-visible boxes. `StopDetailPanel` (Step 8) was reworked
accordingly before this step: it now takes a resolved `stop: TripStop` (not `stops` +
`selectedStopId`) plus `onBack: () => void`, and no longer has a "nothing selected" placeholder
state at all — `TripPage` only ever renders it when there's a real selection.

## What was built

- `frontend/src/pages/TripPage.tsx`:
  - Derives `selectedStop = currentDayStops.find((s) => s.tripStopId === selectedStopId) ??
    null` via `useMemo`.
  - The side column renders `selectedStop ? <StopDetailPanel stop={selectedStop} onBack={() =>
    setSelectedStopId(null)} /> : <StopList stops={currentDayStops} selectedStopId=
    {selectedStopId} onSelectStop={setSelectedStopId} />` — exactly one of the two is ever
    mounted.
  - `PlacesMap`'s `onSelectStop` is still `setSelectedStopId` directly — clicking a marker sets
    the same state the list does, so the side column swaps to the detail panel automatically
    regardless of which entry point (list row or map pin) triggered the selection.
- `frontend/src/styles/TripPage.scss` — `.trip-page__content` (`display: flex; flex: 1;
  min-height: 0`) wraps `.trip-page__side-panel` (`flex: 0 0 320px`, a right border to separate
  it from the map) and `.trip-page__map` (`flex: 1`, fills the remaining width).
- `frontend/src/styles/StopDetailPanel.scss` — dropped the placeholder and border-left rules
  from the original (three-column) design; added a `.stop-detail-panel__back` link style at the
  top of the panel.

## Why these decisions

A single toggling column means there's never a moment where the app shows an empty "select a
stop" box taking up permanent space — the side column is always doing useful work, either
listing stops or showing the one you picked. `onBack` returns you to the list without losing
your place in the current day (the list re-renders from `currentDayStops`, unaffected by
whichever stop you'd been viewing).

## Verification

`npm run typecheck --prefix frontend` — clean. `npm test --prefix backend` — 42/42 passing (run
as a final whole-session sanity check, no regressions from any frontend-only changes).

**Still outstanding (per CLAUDE.md's rule against browser-testing UI changes myself):** please
click through the real flow — generate/open a trip, click a stop in the list and confirm the
panel replaces it with the back link working, click a map pin and confirm the same panel opens
with the pin recentered, switch days and confirm the list resets and the map refits. You'll need
`VITE_GOOGLE_MAPS_MAP_ID` set in `frontend/.env` for the photo pins to render at all.

## Suggested commit title

`feat: wire stop list/detail toggle and map into TripPage`
