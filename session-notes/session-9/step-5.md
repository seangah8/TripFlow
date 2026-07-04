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

Suggested commit title: `feat: refine map pin colors/size and swap fallback icon to lucide-react`
