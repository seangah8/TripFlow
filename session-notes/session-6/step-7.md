# Session 6 (v6) — Step 7: `StopList.tsx` (new)

## What was built

- `frontend/src/components/StopList.tsx` (new) — props `{ stops: TripStop[]; selectedStopId:
  string | null; onSelectStop: (id: string) => void }`. Renders a vertical scrollable list, one
  `<button>` row per stop showing its `order`, `place.name`, and `place.category` (falls back to
  "Uncategorized" when `null` — `category` has existed on `Place` since v1 but was unused in the
  UI until now). Clicking a row calls `onSelectStop(stop.tripStopId)` unconditionally — it always
  selects, never toggles off. The selected row gets a `stop-list__item--selected` modifier class.
  An empty day renders a small "No stops for this day" message instead of an empty list.
- `frontend/src/styles/StopList.scss` (new) — matches the visual language already established by
  `DayTimeline`'s cards (bordered rows, rounded corners, the same blue selected-state highlight
  `#2563eb` used for the selected day card).

## Why these decisions

Selecting is the list's only job — deselecting/closing belongs to the detail panel (Step 8), so
`StopList` never needs a "click again to deselect" branch, matching the same reasoning that
removed the analogous toggle from `DayTimeline` in Step 6.

## Verification

`npm run typecheck --prefix frontend` — clean. `StopList` isn't wired into `TripPage` yet (that's
Step 9, once `StopDetailPanel` also exists), so this step only confirms the component typechecks
and compiles in isolation.

## Suggested commit title

`feat: add StopList component`
