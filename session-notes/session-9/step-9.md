# Session 9 (v9) — Step 9: Create new vacation modal

## Live design decisions (asked before building)
- Keep sharing `wizard.scss`'s shell rather than splitting into a separate stylesheet — it's a single-field prompt, not a distinct multi-step flow, and Step 6 already restyled everything this modal reuses.

## What was built
- `NewVacationModal.tsx` — added the `wizard-step__input` class to its name `<input>`, the one piece Step 6 didn't touch (that step only styled the 3-step wizard's own components). Backdrop, card chrome, and buttons needed no changes — already covered by Step 6.

## Why each decision was made
- Reusing `wizard.scss` avoids duplicating identical backdrop/card/button styles into a new file for a component that's intentionally a lightweight variant of the same modal pattern.

Suggested commit title: `fix: apply wizard input styling to the new-vacation modal's name field`
