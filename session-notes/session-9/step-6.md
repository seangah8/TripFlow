# Session 9 (v9) — Step 6: The wizard

## Live design decisions (asked before building)
- Add a simple step-progress indicator (previously none existed).
- Keep native `<select>` dropdowns for vibe/group/budget — just restyle border/focus, don't rebuild as custom chip groups.
- Modal chrome: apply tokens only (radius/shadow) to the existing centered-card shape, no bigger redesign.

## What was built
- `TripWizardModal.tsx` — new `.wizard-modal__steps` row of three numbered circles (`1`/`2`/`3`), current step filled primary-color, others outlined/muted.
- `wizard.scss` — full pass to tokens: modal card (`radius`, `shadow`), close button (muted → primary on hover), interest chips (primary token instead of hardcoded blue), select fields (border/radius + primary-color focus ring, previously unstyled).
- Buttons across all three steps (`Back`/`Next`/`Generate my trip`, previously unstyled browser-default buttons) now get a shared bordered "secondary" baseline plus a filled-primary override for the one primary action per step — targeted via `button[type="submit"]` (step 1's lone submit button) and `.wizard-step__actions button:last-child` (steps 2–3's Next/Generate), so no component `.tsx` files needed new classNames.

## Why each decision was made
- The step indicator gives users a sense of progress through a 3-step flow that previously had none.
- Native selects were kept per your answer — simplest, fully accessible/keyboard-friendly, and the "just restyle" scope matched what the app needed here (the previous selects were completely unstyled).
- Styling the wizard's buttons was necessary baseline polish for "the wizard" as a whole (they were unstyled browser defaults before this step), done via CSS selectors rather than touching `DestinationStep`/`PreferencesStep`/`ConfirmStep`'s markup.

Suggested commit title: `feat: add wizard step indicator and apply design tokens to modal/fields/buttons`
