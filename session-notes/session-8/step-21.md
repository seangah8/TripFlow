# Session 8 (continued) — Step 21: Rewrite `DestinationStep.tsx`

## What was built

`frontend/src/components/wizard/DestinationStep.tsx` fully rewritten:
- New optional `occupiedRanges?: Array<{ startDate, endDate, city }>` prop (defaults to `[]`).
- `parseDateString`/`formatDateToString` helpers convert between plain `YYYY-MM-DD` strings
  (what the parent state, `ConfirmStep`, and the backend all expect) and `Date` objects (what
  `react-datepicker` works with) — kept local to this file only.
- The two bare `<input type="date">` elements replaced with `<DatePicker>` components:
  `minDate={new Date()}` on the start picker (rule 1 — no past dates, always), `minDate` on the
  end picker following whatever start date is chosen (rule 2 — no end before start, enforced by
  the picker itself now, not just an error message), and `excludeDateIntervals` on both, built
  from `occupiedRanges` (rule 3 — occupied sibling-trip dates are visually unpickable).
- `getValidationError` keeps its existing end-before-start and >14-day text checks (still useful
  as a fallback/explicit message), and gained a new overlap branch that checks the chosen
  start/end pair against `occupiedRanges` directly — this exists because
  `excludeDateIntervals` blocks picking an *individual excluded day* as an endpoint, but doesn't
  stop a valid-looking start/end pair from *spanning across* an excluded interval without
  landing exactly on one of its days.

## Why these decisions

- Date↔string conversion helpers are private to this file rather than a shared utility — nothing
  else in the app needs to talk to `react-datepicker` directly; `TripWizardModal`/`ConfirmStep`/
  the backend all continue to only ever see plain strings.
- `parseDateString` builds a `Date` from explicit year/month/day components rather than
  `new Date(value)` — the latter parses `YYYY-MM-DD` as UTC midnight, which can render as the
  *previous* day in a browser running behind UTC; explicit local construction avoids that
  off-by-one entirely for the picker's display/selection.
- The `getValidationError` overlap branch is real defense in depth, not redundant — it's the one
  case `excludeDateIntervals` alone can't catch (a range that spans over an excluded interval
  without touching its boundary days), mirroring why the backend also independently rejects
  overlaps regardless of what the UI prevents.

## Verification

`npm run typecheck --prefix frontend` clean (needed an explicit `(date: Date | null) => ...`
annotation on both `onChange` handlers — react-datepicker's overloaded prop types don't infer
cleanly from usage alone). Not yet browser-testable — `occupiedRanges` isn't threaded in from
`VacationPage` yet (Step 22), and no styling pass has happened yet (Step 23), so the picker's
popup calendar will look unstyled/default for now.

## Suggested commit title

`feat: replace native date inputs with react-datepicker in DestinationStep`
