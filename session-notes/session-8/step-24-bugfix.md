# Session 8 (continued) — Step 24 bugfix: calendar popup clipped by modal overflow

## What was found

During browser verification, the calendar popup rendered on top of the modal correctly (no
z-index issue), but its top portion — month/year header, prev/next navigation, and earlier day
rows — was clipped off. The wizard modal (`wizard.scss`'s `.wizard-modal`) has `overflow-y:
auto` for its own scrolling content, and `react-datepicker`'s popup renders by default as a
normal DOM child positioned near its input — so it got cut off by that same `overflow-y: auto`
whenever the popup extended above the modal's own visible bounds.

## What was fixed (part 1)

`frontend/src/components/wizard/DestinationStep.tsx` — added `portalId="datepicker-portal"` to
both `<DatePicker>` instances. This renders each popup calendar into a portal attached directly
to `<body>`, entirely outside the modal's DOM subtree, so no ancestor's `overflow`/`z-index`
can clip or hide it regardless of scroll position.

## Second bug found and fixed (part 2)

Portalling to `<body>` fixed the clipping, but introduced a new stacking-order problem: the
portal container had no explicit `z-index`, so it painted *behind* the modal's own
`z-index: 10` — the modal visibly covered the top portion of the now-unclipped calendar.
Fixed by adding a small rule to `frontend/src/styles/wizard.scss`:
```scss
#datepicker-portal {
  position: relative;
  z-index: 20;
}
```

## Why this counts as a bug fix, not styling

Both issues are functional/layout problems (the month header and navigation were literally
inaccessible or hidden, not just visually unpolished), not color/spacing/branding concerns — the
user explicitly asked to defer visual styling to v9, and this was scoped separately as "does it
work at all," which it didn't until these two fixes.

## Verification

`npm run typecheck --prefix frontend` clean after both fixes. Needs the user's browser re-check
to confirm the full calendar (header, navigation, all rows) now renders unclipped **and** on top
of the modal.

## Suggested commit title

`fix: portal the date picker popup to avoid modal overflow clipping`
