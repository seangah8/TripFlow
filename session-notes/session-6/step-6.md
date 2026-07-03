# Session 6 (v6) — Step 6: `DayTimeline.tsx` + `TripPage.tsx` wiring — remove toggle-off, fix `PlacesMap` integration

## What was built

- `frontend/src/components/DayTimeline.tsx` — removed the toggle-off behavior. `onSelectDate`'s
  signature changed from `(date: string | null) => void` to `(date: string) => void`; clicking a
  day card always selects it now — the old "click the selected day again to deselect and show
  all days" branch is gone.
- `frontend/src/pages/TripPage.tsx` — rewritten to match Step 5's new `PlacesMap` prop contract
  (`{ stops, selectedStopId, onSelectStop }` instead of `{ places }`):
  - Replaced the `places: Place[]` `useMemo` with `currentDayStops: TripStop[]` —
    `trip.days.find((day) => day.date === selectedDate)?.stops ?? []` — which keeps the full
    `TripStop` wrapper (order, `tripStopId`, `estimatedMinutes`, `reasoning`) intact instead of
    flattening down to bare `Place[]`.
  - Added `selectedStopId` state.
  - Added a `useEffect` keyed on `trip` that sets `selectedDate` to `trip.days[0].date` and
    clears `selectedStopId` whenever a trip (re)loads — this is what produces "day 1
    auto-selected," and also handles navigating directly from one trip to another.
  - `handleSelectDate(date)` sets `selectedDate` and clears `selectedStopId` — switching days
    always drops whatever stop was selected, since it no longer applies.
  - `<PlacesMap>` is now called with `stops={currentDayStops} selectedStopId={selectedStopId}
    onSelectStop={setSelectedStopId}` instead of the stale `places={places}` left over from
    Step 5's prop-signature change.

## Why bundled together (out of the plan's original step order)

`DayTimeline` and `TripPage` are tightly coupled through `selectedDate`: `PlacesMap`'s new
contract (from Step 5) requires exactly one day's stops, with no "null = show everything" case.
`DayTimeline` couldn't drop its deselect-to-null behavior without `TripPage` also being fixed to
always have a real `selectedDate` — so leaving either one alone would have left the app in a
half-broken state (either a dead prop path or a `currentDayStops` that silently goes empty when
a day is deselected). Fixed together in one step instead.

## Verification

`npm run typecheck --prefix frontend` — clean across the whole frontend; the `places={places}`
mismatch flagged during Step 5's checkpoint is resolved.

## Note on step order

This step folds together the plan's original Step 6 (`DayTimeline`) with the state/data-wiring
half of Step 9 (`selectedDate`/`selectedStopId` ownership, day-1 default, `currentDayStops`
derivation, correct `PlacesMap` props). Step 9's remaining work — inserting `StopList` and
`StopDetailPanel` into the layout and restructuring `TripPage.scss` into three columns — still
needs Steps 7 and 8 (those components) built first, so it's deferred to a final pass once they
exist.

## Suggested commit title

`fix: wire TripPage to PlacesMap's new stops-based contract, remove day-deselect`
