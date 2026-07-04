# Session 9 (v9) — Step 11: App logo

## Live design decisions (asked before building)
- Icon + wordmark, not wordmark-only or icon-only — reads as a real brand mark.

## What was built
- `Logo.tsx`/`Logo.scss` (new) — `lucide-react`'s `Route` icon (a path between two points) next to the "TripFlow" wordmark, primary-colored. Chose a lucide icon over a hand-drawn SVG asset since it's already clean and on-theme with the rest of the app's iconography, and needs no separate asset file to keep in sync.
- `Header.tsx` — swapped the Step 1 text placeholder for `<Logo />`.
- `LoginPage.tsx`/`RegisterPage.tsx` — swapped `<h1>TripFlow</h1>` for `<Logo size={28} />`.
- Cleanup: removed `Header.scss`'s now-redundant brand typography rule (Logo.scss owns its own color/font now) and `LoginPage.scss`'s now-dead `h1` rule.

## Why each decision was made
- A lucide icon avoids introducing a new SVG asset file/format to maintain, while still giving the wordmark a real glyph instead of plain text.
- `align-self: center` was added directly to `.logo` (not page-specific CSS) so the same component centers correctly in both contexts it's used in (Header's row, LoginPage's centered column) without each caller needing its own positioning rule.

Suggested commit title: `feat: add the TripFlow logo and wire it into the header and auth pages`
