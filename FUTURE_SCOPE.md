# TripFlow — Future Scope

## Fixes to do before continuing with the versions

Not deferred roadmap items — gaps in already-shipped versions to clean up before starting the next one.

- **Pace controls stop density**: `preferences.vibe` is sent to Claude as context but never actually
  changes `PLACES_PER_DAY_TARGET` or the per-day cap — relaxed/moderate/packed should each target a
  different stops-per-day number.
- **Long trips get too few stops per day**: a 1-day trip yields ~12-14 stops, but a 14-day trip can
  drop to 2-4/day — raw place supply and curation don't scale with trip length.
- **Multi-city vacations get inconsistent stop counts**: two cities in the same vacation can end up
  with noticeably different numbers of stops from each other.
- **Small cities pull in places from too far away**: when a city doesn't have enough places matching
  the search text query, the search radius keeps expanding and starts pulling in places from
  neighboring cities instead — should cap the search radius instead of letting it drift that far.

---

> Things intentionally left out of the committed v0–v9 roadmap. These aren't afterthoughts —
> each one was designed in enough detail to know it's buildable, then deliberately deferred for
> time. Version numbers below continue from the committed roadmap in `BLUE_PRINT.md` (which ends
> at v9) purely to show these were real, sequenced plans, not just a wishlist — they are not
> committed or scheduled.

## v10 — Opening-hours awareness

A place closed on the day it would've landed on no longer shows up there. A place that's *only*
open on Sundays gets steered toward a Sunday in the trip instead of a day it's actually closed.

- Reintroduce hours data into the pipeline: after clustering assigns real calendar dates, check
  each stop against `places.openingHours` for its assigned date.
- If closed that day: prefer **reassigning** it to a different day in the trip where it's open
  (a place that's Sunday-only should move toward a Sunday, not just get dropped), falling back to
  dropping it only if no day in the trip works.

## v11 — Hotel/address-anchored ordering

The wizard asks for a hotel/starting address. Each day's stops are ordered — starting from that
address, in a sequence that makes geographic sense *and* respects each stop's opening hours *and*
avoids nonsensical back-to-back groupings (e.g. three restaurants in a row). Genuinely harder than
plain distance-sorting — real ordering needs geography, hours, and category variety all satisfied
at once, not just nearest-neighbor.

- Hotel lat/lng becomes the clustering anchor point (replacing the city-bounding-box centroid
  init from v3).
- Within each day, order stops using position + hours constraints, with category spacing so
  similar stop types (e.g. multiple meals) don't cluster back-to-back.

## v12 — Multi-user / shared vacations

Requires real-time sync or conflict resolution across multiple editors on the same vacation; single
owner (v7) keeps the committed scope simple.

## v13 — Editable / draggable plan

Letting a user manually reorder or edit a generated plan. Significant UI complexity; view-only is
the right scope for the committed roadmap.
