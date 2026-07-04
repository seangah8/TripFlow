# Session 9 (v9) — Step 3: Detail/list stops panel

## Live design decisions (asked before building)
- List rows: keep the existing plain-list look, just recolor accents to the new primary token (no added card/shadow treatment).
- Detail panel: merge into the list entirely — no more separate list⟷detail views.
- Interaction: clicking a stop expands that row in place with a slide/height animation to reveal its detail content; the list itself contains the detail, rather than navigating to a separate panel and back.

## What was built
- `StopList.tsx` — each stop is now a `StopListItem`: a header button (order badge + name/category, same as before) plus an `.stop-list__expand` region that shows `estimatedMinutes`, `reasoning`, and the photo/fallback (previously `StopDetailPanel`'s content) when that row is the selected one.
- The expand/collapse animation uses `grid-template-rows: 0fr` → `1fr` with a `transition` (a CSS-only technique for animating to an unknown/auto content height, no JS measuring).
- Toggle behavior: clicking the expanded row's own header collapses it (`onSelectStop(null)`); clicking a different row expands that one instead (single-open accordion, same as the old single-selection model).
- A `useEffect` calls `scrollIntoView` on the row whenever it becomes expanded — needed because selecting a stop via a map-marker click can target a row currently scrolled out of view, which the old design didn't have to handle (the detail panel replaced the whole list, so nothing needed scrolling).
- `StopDetailPanel.tsx`/`.scss` deleted; `TripPage.tsx` now renders `StopList` unconditionally (no more `selectedStop ? <StopDetailPanel/> : <StopList/>` branch), and the now-unused `selectedStop` memo was removed.
- `StopList`'s `onSelectStop` prop type widened from `(id: string) => void` to `(id: string | null) => void` to support the collapse case.

## Why each decision was made
- The merge was an explicit interaction redesign, not just a visual pass — the user wanted the list to contain its own detail view via in-place expansion instead of a page-level toggle.
- Row styling was deliberately left structurally unchanged (per the "just recolor" answer) — only the accent color moved from the old hardcoded blue to `tokens.$color-primary`.

Suggested commit title: `feat: merge stop list and detail panel into an inline-expanding accordion`
