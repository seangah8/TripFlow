# Session 3 (v3) — Step 1: `clustering.ts`

## What was built

`backend/src/utils/clustering.ts` — a pure, deterministic K-means clustering function `clusterPlacesByDay(places, days)` that replaces the round-robin split. It seeds N centroids by slicing the longitude range of all places, runs up to 10 assign/recompute cycles (early-stopping when assignments stabilize), merges any cluster under 3 places into its nearest neighbor by centroid distance, then caps any cluster over 15 places to the top-15-by-rating.

## Why each decision was made

- No RNG anywhere — centroids are seeded purely from `min`/`max`/`mean` of the input, so identical input always gives identical output (the locked architecture rule: "clustering is deterministic code, same input always produces the same output").
- Ties (nearest-centroid assignment, nearest-neighbor-for-merge) are all broken by "lowest index wins" — one consistent rule everywhere instead of ad-hoc tie-breaking in different spots.
- An empty cluster keeps its previous centroid instead of going to `NaN` — this is what lets the merge step always have a well-defined distance to measure, even for a cluster that received zero places.
- Merge runs before cap (matches BLUE_PRINT.md's explicit ordering: "cap each day at 15 places... if a cluster somehow exceeds that [after merging]") so a merge that pushes a cluster over 15 still gets capped correctly.
- `Place` is imported with `import type` — no `reflect-metadata`/DB coupling, keeping the module trivially unit-testable with no DB dependency.
- Cluster→day mapping is index-order (`clusters[i]` → `days[i]`), not sorted by longitude or anything else — confirmed with the user as "arbitrary/centroid-seed order," still fully deterministic.

## Suggested commit title

`feat: add K-means clustering utility for geographic day-splitting`
