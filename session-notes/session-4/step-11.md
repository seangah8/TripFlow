# Session 4 (v4) — Step 11: `PreferencesStep.tsx`

## What was built

- `frontend/src/components/wizard/PreferencesStep.tsx` — step 2 of the wizard:
  - Interests: 5 toggle chips (Museums, Food & Drink, Nature, Nightlife, Shopping). Toggling
    only adds/removes from the array — zero selected is a valid, intentional state (falls back
    to the broad baseline-only search per `BLUE_PRINT.md`/`placeService.ts`).
  - Vibe, Group type, Budget: native `<select>` dropdowns, each with the values locked in
    `types/trip.ts`'s `TripPreferences` (Relaxed/Moderate/Packed; Solo/Couple/Family with
    kids/Friends; Budget/Mid-range/Luxury).
  - Back/Next buttons — no validation gate on Next, since every field always has *some* valid
    value (dropdowns can't be blank, interests can legitimately be empty).
- `frontend/src/components/wizard/TripWizardModal.tsx` — added the `preferences` state that was
  deferred from Step 10 (now that `PreferencesStep` is its real consumer), with
  `DEFAULT_PREFERENCES` as the initial value. Step 2 now renders the real `PreferencesStep`; step
  3's placeholder now also echoes the live `preferences` object so the full plumbing is visibly
  working end to end, even before `ConfirmStep` exists.
- `frontend/src/styles/wizard.scss` — chip, dropdown-field, and action-row styles.

## Why these decisions

- **Default preferences** (`vibe: moderate`, `interests: []`, `groupType: solo`,
  `budget: mid-range`) — flagged as a proposal back in Step 10's plan; going with these now as
  neutral, inoffensive starting points. Easy to change later if you'd rather default differently
  (e.g. pre-selecting an interest).
- No "must pick at least one interest" gate — the backend and `placeService.ts` both already treat
  zero interests as a first-class, meaningful choice (the original broad search), so the UI
  shouldn't contradict that by forcing a selection.
- Chips over checkboxes for interests — matches the "multi-select chip row" description in the
  original blueprint's Screen 2 mockup.

`npm run typecheck --prefix frontend` — clean.

**Suggested commit title:** `feat: add PreferencesStep with interest chips and preference dropdowns`
