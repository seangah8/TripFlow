# Session 4 (v4) — Step 9: `HomePage.tsx`

## What was built

- `frontend/src/pages/HomePage.tsx` — replaces the stub from Step 7. "TripFlow" heading + tagline,
  an "Add Trip" button that flips a local `isWizardOpen` boolean (`useState`) to `true`. While
  open, renders a placeholder overlay (with a Close button) standing in for the real wizard modal.
- `frontend/src/styles/HomePage.scss` — centered layout for the button/tagline, plus a temporary
  full-screen overlay style for the placeholder.

## Why these decisions

- `isWizardOpen` is local `useState` in `HomePage`, not lifted anywhere else — nothing outside
  this component needs to know whether the wizard is open, so there's no reason to share it (same
  reasoning as the earlier decision to skip Zustand for the wizard's own step/form state).
- Placeholder overlay instead of the real modal — `TripWizardModal` doesn't exist until Step 10;
  this keeps the step sequence the plan laid out (HomePage's shell first, wizard content next)
  rather than building both at once. Same incremental pattern as Steps 7→8 (`TripDetailPage`
  stubbed, then fleshed out).

`npm run typecheck --prefix frontend` — clean.

**Suggested commit title:** `feat: add HomePage with Add Trip button and wizard placeholder`
