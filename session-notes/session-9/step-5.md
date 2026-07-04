# Session 9 (v9) — Step 5: Map pins

## Live design decisions (asked before building)
- Keep the existing teardrop pin shape — recolor to tokens and refine (size/shadow) rather than redesign the shape.
- Replace the hand-rolled `NoPhotoIcon` SVG with a `lucide-react` icon, now that the library is installed.

## What was built
- `PlacePin.scss` — border/shadow moved to `tokens.$color-text-muted` (unselected) / `tokens.$color-primary` (selected); pin size bumped 36px→40px (shape 28px→32px); shadow strengthened via `tokens.$shadow-md`.
- `NoPhotoIcon.tsx` — now renders `lucide-react`'s `ImageOff` instead of a hand-rolled inline SVG, keeping the exact same `className`-only prop contract so both call sites (`PlacePin`, `StopList`) needed no changes.

## Why each decision was made
- The teardrop/photo-pin pattern already reads well and is distinctive — a full redesign wasn't warranted, just a token-based recolor plus a slightly stronger presence over the map.
- Preserving `NoPhotoIcon`'s existing interface let the icon swap happen without touching any of its call sites — a pure internal implementation change.

## Follow-up tweaks (post-checkpoint, in browser)
- Pins enlarged further (40px→56px) with a stronger shadow on both selected/unselected states, per user feedback that the initial size was still too small.
- Separately (not originally scoped to this step, but done alongside it): `TripPage`'s old text header (back link + city `<h1>`) was removed entirely, replaced by a plain circular icon-only back button (`lucide-react`'s `ArrowLeft`) at the top of the side panel, above the stop list. The side panel became a flex column (button + list), and `StopList`'s sizing changed from `height: 100%` to `flex: 1; min-height: 0` to fill the remaining space.
- The map (`.trip-page__map`) gained margin on all sides plus `border-radius`/`overflow: hidden`, so it reads as an inset rounded card rather than running edge-to-edge — requested separately from the pin sizing.
- Iterated on spacing a few times based on screenshots: increased the gap between the new back button and the list, then removed the side panel's leftover `border-right: 1px solid #ddd` divider line (looked like stray gray line) and undid an over-correction that had pushed list cards too far from their own scrollbar.

Suggested commit title: `feat: refine map pin colors/size and swap fallback icon to lucide-react`
