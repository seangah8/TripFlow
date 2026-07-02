# Session 1 (v1) — Step 7: Frontend: CityForm component

## What was built
`frontend/src/components/CityForm.tsx` — a controlled `<form>` with a city text input and a Generate button. Fully controlled via props: `city`, `onCityChange`, `onGenerate`, `isPending`.

## Why these decisions
- **Controlled, presentational component** — `CityForm` holds no state of its own; `App.tsx` (Step 9) owns `city` via `useState` and the mutation via `useGeneratePlaces`. Keeps this component trivially reusable/testable and matches the "plain `useState` for form fields" rule from `BLUE_PRINT.md` v1–v3.
- **`<form onSubmit>`** rather than a bare button `onClick` — lets pressing Enter in the input trigger Generate too, at no extra cost.
- **Button disabled when `isPending` or city is blank** — prevents duplicate in-flight requests and empty-city submissions without needing separate validation logic elsewhere.

## Bugfix applied within this step
`JSX.Element` as a bare global type doesn't resolve under this project's React 19 + `verbatimModuleSyntax` setup (`error TS2503: Cannot find namespace 'JSX'`). Fixed by importing `JSX` as a type from `'react'`: `import type { FormEvent, JSX } from 'react'`, rather than relying on the old ambient global namespace.

## Suggested commit title
`feat: add CityForm component`
