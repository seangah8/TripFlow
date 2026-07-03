# Step 5: Build the /test-ai-pipeline skill

## What was built

Three pieces closing the gap CLAUDE.md already documented but never actually built:

- `backend/src/scripts/testAiPipeline.ts` — calls `generateTrip()` directly with one fixed, hardcoded fixture (Lisbon, 2026-09-01 to 2026-09-04, museums+food/couple/mid-range) against the real Google Places and Anthropic APIs, prints a human-readable day-by-day stop list (name, rating, category), totals, and elapsed time.
- `backend/package.json` — added `"test:ai-pipeline": "tsx src/scripts/testAiPipeline.ts"`.
- `.claude/skills/test-ai-pipeline/SKILL.md` — frontmatter (`name`, `description`) + procedure, following the exact convention already established by `.claude/skills/sync-blueprint/SKILL.md`.

## Why each decision was made

- **Fixed, hardcoded fixture, never varying between runs** — the whole point is that a human (or Claude Code) can compare today's output against a previous run and immediately notice a regression: an empty day, off-theme places, a curated-count drop, a thrown error.
- **Not mocked — real Google Places and real Anthropic calls** — this is meant to catch real regressions, including in prompt behavior, that a mocked test could never surface.
- **No pass/fail assertions** — there's no expected-output fixture to diff against; this is a human-in-the-loop sanity check (per the skill's own procedure: report the output, flag anything that looks wrong, don't declare success automatically), not a CI gate.
- **No cleanup of the `trips`/`trip_stops` rows it creates** — the dev DB is disposable (`synchronize: true`), matching how generating a trip through the UI already leaves rows behind.
- **CLAUDE.md's "Common commands" section is left untouched for now** — adding the new command there is exactly the kind of small doc drift `/sync-blueprint` is meant to reconcile at end of session, rather than editing CLAUDE.md mid-session.

## Verification

`npm run typecheck --prefix backend` is clean. The skill is already recognized by the harness (shows up in the available-skills list) immediately after being created.

## Suggested commit title

`feat: add /test-ai-pipeline skill and fixed-input regression script`
