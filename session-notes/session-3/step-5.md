# Session 3 (v3) — Step 5: End-to-end verification + rebalancing fix

## What was built

`npm run typecheck` and `npm test` passed after Step 4. Manual browser testing then surfaced a real problem: with real Google Places data, some days ended up with 0 stops while others had 10+.

**Root cause:** the original `clustering.ts` design (per `BLUE_PRINT.md`'s literal spec) merged any under-3-place cluster fully into its nearest neighbor — which can empty a day's slot entirely — and separately dropped any overflow beyond 15 places rather than sending it anywhere. With real, geographically uneven place density (most Google results cluster around a city's downtown/tourist zone), this combination reliably produced exactly the "0 vs 10+" split observed.

**Fix — replaced merge+drop with a single balancing pass:**
- `computeTargetSizes(total, n)`: an as-even-as-possible per-day target via divmod (sizes differ by at most 1), capped at 15/day.
- `balanceClusters(clusters, n)`: repeatedly moves the *lowest-rated* place from the most over-target cluster to the most under-target cluster, until every day matches its target. Geography still decides which places best fit which day initially — balancing only reassigns the least-valuable "extras" needed to close the gap.
- Overflow is now genuinely dropped only when total places exceed `15 × totalDays` — i.e. only when even a perfectly even split can't fit everyone.

Removed `mergeSmallClusters`/`capClusters`/`MIN_CLUSTER_SIZE` (superseded by the unified balance step). Rewrote the 3 tests that depended on the old merge/drop behavior; all 7 tests still pass, `npm run typecheck` still clean.

**Second round — balancing broke geographic coherence within a day.** The first version of `balanceClusters` moved the globally lowest-rated place from whichever day had the biggest surplus, with no regard for how far that place actually was from the day receiving it — confirmed in the browser (a day ended up with Arc de Triomphe/Eiffel Tower stops mixed with a Panthéon stop, ~5km+ away). Fixed by changing the selection rule: for the neediest day, scan every place across every over-full day and move whichever one is geographically nearest to that day's centroid (a fixed snapshot from the k-means result, not recomputed mid-balance); rating only breaks an exact-distance tie. Re-verified the exact transferred places against the actual test run rather than continuing to hand-derive them (multi-step iterative selection is easy to get subtly wrong by hand) — all 7 tests still pass, `npm run typecheck` still clean.

**Third round — a single greedy nearest-transfer still isn't enough.** The user pointed out the browser result still mixed far-apart stops in one day, and suggested explicitly checking each cluster's average distance from its own center and minimizing it. Root cause: when a recipient day needs more than one place and only one donor day has any surplus, a single nearest-transfer pass can be *mathematically forced* to pull from a far-away donor with no better option available at that moment — the transfer heuristic has no way to reconsider once done. Added `improveCompactness(clusters, n)`: after balancing fixes sizes, this repeatedly scans every pair of days and every pair of their places, swapping one-for-one whenever it reduces both days' combined squared distance to their own center, until a full pass finds no more improving swaps (bounded by `MAX_SWAP_PASSES = 20` as a safety cap). A swap always trades one place for one place, so it never disturbs the even split from balancing. Added a new test that verifies this directly and generally: after clustering, no swap between any two days' places can reduce their combined spread — i.e. the result is a genuine local optimum for compactness, not just "checked by hand for one scenario." All 8 tests pass, `npm run typecheck` clean.

## Why each decision was made

- Balancing (not just a bigger merge threshold) was the right fix because the problem was two-sided: clusters could be too small (need filling) or too large (need to give some away) — a single mechanism that treats both as "distance from target" is simpler and more correct than two separate merge/cap mechanisms that don't coordinate with each other.
- Nearest-to-recipient selection (not lowest-rated-anywhere) is what actually preserves the point of v3 — geographic coherence within a day — while still achieving even counts; rating alone had no way to know or care how far away a "cheap" filler place was.
- The swap-improvement pass exists because a single greedy transfer pass is inherently short-sighted — it can't undo an earlier forced choice once a better option appears later. A local-search cleanup afterward (bounded, deterministic, size-preserving) catches what the greedy pass couldn't.
- The new test asserts the actual property that matters ("no swap helps") instead of hand-tracing one scenario's exact expected output — more honest about what's actually guaranteed, and it'll catch a real regression if the swap logic ever breaks.
- Worth noting a genuine limit: when real geography has isolated dense poles with a genuinely empty middle (an adversarial edge case, not typical for real city data), perfectly even day sizes and perfectly tight compactness can be mathematically incompatible — something has to give. This doesn't come up for normal city density, which is the case that matters here.
- All three rounds are deliberate, flagged deviations from `BLUE_PRINT.md`'s literal v3 wording ("merge under-3 into nearest neighbor," "cap at 15 and drop overflow") — surfaced explicitly rather than silently changed, based on real behavior observed testing against actual data, which the original spec's simpler description hadn't accounted for.

## Suggested commit title

`fix: add swap-based compactness cleanup after geographic day-balancing`
