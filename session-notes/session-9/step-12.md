# Session 9 (v9) — Step 12: Loading cover

## Context that shaped this step
The user raised a real UX problem, not just cosmetics: trip generation can take minutes, and until now nothing stopped a user from closing the wizard or navigating away mid-generation — with no indication it was still running and no automatic redirect once it finished. This step's design was driven by that concern first, the "creative loading animation" request second.

## Live design decisions (asked before building)
- Loading cover during generation replaces the wizard modal's own content in place (not a full-screen takeover).
- Animation: an animated route being drawn between two pins, tying into the Logo's Route icon/travel theme.
- Other loading states (page loads) get a smaller inline spinner variant of the same component, not the full animation.

## What was built
- `TripWizardModal.tsx` — the `useAddTripToVacation` mutation moved here from `ConfirmStep` (lifted up), so the modal itself can see `isPending`. Backdrop click and the `×` close button are now guarded (`handleClose` no-ops while `isPending`); the close button also gets a `--disabled` visual state (dimmed).
- `ConfirmStep.tsx` — became a controlled/presentational component (`isPending`, `error`, `onGenerate` passed as props instead of owning the mutation). While `isPending`, its entire content is replaced by `<LoadingOverlay message="Generating your trip — this can take a minute or two…" />`.
- `LoadingOverlay.tsx`/`.scss` (new) — two variants:
  - `full` (default): an SVG route line between two pin circles, animated via CSS `stroke-dashoffset` (using `pathLength="100"` to normalize the dash math regardless of the curve's actual geometry) so it loops as a continuously drawing/flowing line.
  - `inline`: a small CSS spinning-ring, for quick page loads.
- Wired `variant="inline"` into every bare `<p>Loading…</p>` in the app: `App.tsx`'s initial auth check (new `.app-boot-loading` full-viewport centering class in `main.scss`), `DashboardPage`, `VacationPage`, `TripPage`.

## Why each decision was made
- Blocking close/backdrop-click during generation directly solves the "user bounces out of the wizard mid-generation" problem — lifting the mutation to the modal was necessary because only the modal (not `ConfirmStep`, nested one level deeper) can gate its own close behavior.
- The route-drawing animation reuses the same Route glyph/theme as the Step 11 logo, rather than a generic spinner, so it reads as on-brand rather than a stock loading indicator.
- Login/Register/NewVacationModal's quick-action buttons deliberately kept their existing text-only pending labels — those resolve near-instantly, unlike generation, so a spinner there wasn't worth the added visual weight.

## Follow-up tweaks (post-checkpoint, in browser)
- Route path revised twice based on feedback: first attempt (zigzag straight-line segments) was rejected as looking worse than the original smooth curve; replaced with an all-cubic-bezier path that includes an actual loop in the middle — achieved by a bezier segment whose start/end anchor is the same point with wide-swinging control points, which makes the curve cross itself into a circle shape instead of just bulging.
- `.loading-overlay__message` shrunk to `0.85rem` with `white-space: nowrap` so the generation message stays on one line instead of wrapping.

Suggested commit title: `feat: block wizard close during trip generation and add an animated loading cover`
