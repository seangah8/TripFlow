# Session 9.5 — Step 1: City autocomplete

## What was built
- `TripWizardModal.tsx` wraps only the `step === 1` block in `<APIProvider apiKey={VITE_GOOGLE_MAPS_API_KEY} libraries={['places']}>` (narrowed after review — initially wrapped the whole modal, but only `DestinationStep` needs the `places` library) — a second, independently-scoped `APIProvider` from `PlacesMap.tsx`'s (the wizard and the trip map are never mounted at the same time, so there's no double-load conflict). Trade-off of the narrower scope: navigating step 1 → 2 → back to step 1 remounts `APIProvider` each time, re-running its script/context init, vs. staying warm for the whole modal session if it wrapped everything.
- `DestinationStep.tsx`'s city `<input>` gets a real Google Places Autocomplete attached via `useMapsLibrary('places')` + `new placesLibrary.Autocomplete(inputRef.current, { types: ['(cities)'] })` (legacy widget, per user's choice over the new `PlaceAutocompleteElement`).
- Added local `isCitySelected` boolean state: set `true` only on a real `place_changed` selection, reset to `false` on any manual keystroke. `canProceed` (and the "Next" button) now require `isCitySelected`, not just non-empty text — enforces FUTURE_SCOPE.md's "only real cities can be submitted."
- On selection, `place.name` (bare locality name, e.g. `"Paris"`) is written into the existing `city` string state via the unchanged `onCityChange` prop — `GenerateTripInput`, `Trip.city`, and the DB column are untouched (per the "string only" scope decision).
- Added `.wizard-step__hint` style in `wizard.scss` (uses `$color-text-muted`) for a "Please select a city from the suggestions" message shown when text is present but not yet a valid selection.
- `npm run typecheck --prefix frontend` passes. No new dependency needed — `@types/google.maps` is already a transitive dependency of `@vis.gl/react-google-maps`.

## Why these decisions
- Legacy `google.maps.places.Autocomplete` over `PlaceAutocompleteElement`: simpler integration with the existing controlled `<input>`, confirmed by the user (aware of the deprecation-for-new-keys caveat, low risk for an existing key).
- Validation state (`isCitySelected`) kept local to `DestinationStep` rather than lifted into a prop change — avoids touching `TripWizardModal` or any shared type shape.
- Resolved value is `place.name` (bare city name) rather than `formatted_address` — matches what the backend's Google Places text-query building already expects; same-name-city ambiguity already existed with free text, so this isn't a new regression.

## Outstanding
- Manual step (not code): the `VITE_GOOGLE_MAPS_API_KEY` Google Cloud project needs the legacy **Places API** enabled (distinct from Places API (New), which the backend uses).
- Browser verification outstanding per CLAUDE.md §5.2 — user needs to open the wizard, confirm only real-city suggestions appear, and that "Next" stays disabled until a suggestion is actually picked.

## Suggested commit title
`feat(wizard): restrict city input to Google Places Autocomplete`
