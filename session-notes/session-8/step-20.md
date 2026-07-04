# Session 8 (continued) — Step 20: `npm install react-datepicker`

## What was built

Added `react-datepicker` (`^9.1.0`) to `frontend/package.json`'s dependencies. No
`@types/react-datepicker` needed — v9.1.0 ships its own bundled `.d.ts` (confirmed via
`node_modules/react-datepicker/package.json`'s `"types"` field).

## Why these decisions

Confirmed with the user earlier this session: chosen over hand-rolling a calendar-grid
component specifically because it supports `minDate` and `excludeDateIntervals` natively,
avoiding custom month-navigation/day-grid/accessibility logic.

## Verification

`npm run typecheck --prefix frontend` clean. Dependency-only change — no application code uses
it yet (that's Step 21).

## Suggested commit title

`chore: add react-datepicker dependency`
