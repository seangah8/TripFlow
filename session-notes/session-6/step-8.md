# Session 6 (v6) — Step 8: `StopDetailPanel.tsx` (new)

## What was built

- `frontend/src/components/StopDetailPanel.tsx` (new) — props `{ stops: TripStop[];
  selectedStopId: string | null; onClose: () => void }`. Derives `selectedStop = stops.find(s =>
  s.tripStopId === selectedStopId) ?? null` via `useMemo`. When `selectedStop` is `null`, renders
  a placeholder ("Select a stop to see details."). When set, renders the place's name (heading),
  category (same "Uncategorized" fallback as `StopList`), `estimatedMinutes` (`~N min`),
  `reasoning` as a paragraph, and a `×` close button calling `onClose()`.
- `frontend/src/styles/StopDetailPanel.scss` (new) — docked-panel look (a left border to
  visually separate it, no backdrop, no modal overlay pattern).

## Why these decisions

The panel is **always mounted**, never conditionally rendered as a whole — only its *contents*
switch between the placeholder and the real detail. This means opening/closing a stop's detail
never changes the panel's width, so the map next to it never jumps or re-renders its bounds.
`estimatedMinutes`/`reasoning` render conditionally on non-null as a defensive fallback, even
though in practice Step 3 guarantees a curated stop always has both set together.

## Verification

`npm run typecheck --prefix frontend` — clean. Not yet wired into `TripPage` (that's Step 9,
which also finishes the three-column layout).

## Suggested commit title

`feat: add StopDetailPanel component`
