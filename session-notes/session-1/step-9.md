# Session 1 (v1) — Step 9: Frontend: App.tsx composition + styling

## What was built
- `App.tsx` — composed `CityForm` + `PlacesMap`: `city` held via `useState`, `useGeneratePlaces()` mutation drives `places`/`isPending`/`error`, Generate calls `mutate(city.trim())`.
- `App.scss` — minimal layout: full-height flex column, header row (title + form + inline error), map filling the remaining space.
- Installed `sass` as a dev dependency.

## Why these decisions
- Errors surface inline under the header (`error.message` from the mutation) rather than a toast/modal — simplest option that satisfies "the user can see something went wrong," matching v1's scope (no dedicated error-handling polish yet).
- `places ?? []` passed to `PlacesMap` so it always gets an array, even before the first generate — keeps `PlacesMap` from needing to handle an `undefined` case itself.

## Bugfix applied within this step
Vite has no built-in Sass support — `App.scss`/`main.scss` existed as empty placeholder files since v0, but the `sass` package was never installed, so any real `.scss` content would have failed to build. Installed it now that `App.scss` actually has rules in it.

## Follow-up restructure (same step, after user feedback)
Per user request, extracted the page logic out of `App.tsx` into a dedicated page component so `App.tsx` stays reserved for routing as the app grows (v7 adds real multi-page routing):
- `frontend/src/pages/TripPage.tsx` (new) — now holds the `city` state, `useGeneratePlaces` mutation, and `CityForm` + `PlacesMap` composition that used to live directly in `App.tsx`.
- `frontend/src/styles/TripPage.scss` (new, replaces `App.scss`) — same rules, class names renamed `.app*` → `.trip-page*`.
- `App.tsx` — now just renders `<TripPage />`. No router library installed yet — v1 has exactly one screen, so `react-router-dom` would be infrastructure with nothing to route between yet. This keeps `App.tsx` thin so swapping in a router at v7 is a drop-in change, not a rewrite.

## Suggested commit title
`refactor: extract TripPage, keep App.tsx routing-only`
