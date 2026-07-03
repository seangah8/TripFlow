# Session 4 (v4) — Step 10: frontend types + `TripWizardModal` + `DestinationStep`

## What was built

- `frontend/src/types/trip.ts` — added `TripPreferences`, mirroring the backend's shape exactly.
- `frontend/src/hooks/useGenerateTrip.ts` — `GenerateTripInput` gains `preferences: TripPreferences`.
- `frontend/src/components/wizard/DestinationStep.tsx` — step 1: city + date-range inputs and
  validation, adapted directly from `TripForm.tsx` (same `MAX_TRIP_DAYS`/`getValidationError`
  logic), with `onGenerate`/`isPending` replaced by a plain `onNext` — this step only advances the
  wizard, it doesn't submit anything.
- `frontend/src/components/wizard/TripWizardModal.tsx` — the modal shell: owns `step` (1–3),
  `city`, `startDate`, `endDate` via `useState`, renders `DestinationStep` for step 1 and
  placeholders for steps 2/3 (with working Back/Next buttons so the full 1→2→3→back flow is
  testable now). Clicking the backdrop or the × closes the modal; clicking inside the modal
  itself doesn't (stops propagation).
- `frontend/src/pages/HomePage.tsx` — swapped the Step 9 placeholder overlay for the real
  `<TripWizardModal onClose={...} />`.
- `frontend/src/styles/wizard.scss` — modal backdrop/box/close-button and shared wizard-step
  layout styles.
- `frontend/src/styles/HomePage.scss` — removed the now-unused `.home-page__wizard-placeholder`
  rule.

## Why these decisions

- **`preferences` state is *not* in `TripWizardModal` yet**, despite the plan listing it here —
  this project's `tsconfig.app.json` has `noUnusedLocals: true`, and with no consumer until
  `PreferencesStep` exists, declaring it now would just be a compile error. It moves to Step 11
  alongside the component that actually reads and updates it. Everything else (step, city, dates)
  already has a real consumer (`DestinationStep`, the step-3 placeholder's summary line), so those
  stay as planned.
- Step 2/3 placeholders have working navigation (not just static text) specifically so this step
  is fully testable on its own — you can open the wizard, fill in step 1, and click all the way
  through to step 3 and back, before Preferences/Confirm exist for real.
- Backdrop-click-to-close with `stopPropagation` on the modal box itself — standard modal pattern,
  avoids the wizard closing every time you click inside it.

`npm run typecheck --prefix frontend` — clean. Full interactive click-through is still Step 14 —
Preferences (Step 11) and Confirm/Generate (Step 12) don't exist yet, so there's no way to reach a
real trip through the UI yet.

**Suggested commit title:** `feat: add wizard modal shell with Destination & Dates step`
