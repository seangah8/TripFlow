# Session 6 (v6) — Post-session: two new project skills

## What was built

- `.claude/skills/review-session/SKILL.md` (new) — reviews only a session's own changes for
  correctness bugs, using `session-notes/session-N/step-*.md` files to determine scope (which
  files to diff) instead of scanning the whole repo/branch. A single focused review pass, not
  the multi-agent finder/verifier fleet a full `/code-review` spawns. Falls back to a plain
  `git diff` of uncommitted changes if the session has no step files yet.
- `.claude/skills/start-session/SKILL.md` (new) — a cheap orientation briefing at the start of a
  session: reads `CLAUDE.md`, `BLUE_PRINT.md`'s version table/current-version section, and the
  most recent `session-notes/session-N/` folder's step files, plus a light `git status`/`git
  log` check. Reports current version/status, what was last built, anything flagged as
  outstanding, and a suggested next action. Explicitly never reads backend/frontend source.
- `CLAUDE.md` updated:
  - §5.1 (Starting a session) — added `/start-session` as step 0, before `/plan`.
  - §5.5 (End of session) — `/review-session` replaces `/code-review` as the routine per-session
    step; `/code-review` stays available to invoke manually for a deeper full-branch pass.
  - §9 (Custom skills table) — both new skills added, with `/sync-blueprint`'s "after" reference
    updated from `/code-review` to `/review-session`.

## Why these decisions

You confirmed `/review-session` should **replace** `/code-review` in the standard workflow
(not sit alongside it) — the whole motivation was that a full `/code-review` pass, sized for a
big milestone, was overkill for routine per-session checks on this project's limited API budget.
`/code-review` itself wasn't removed as an option; it's just no longer the automatic step.

Both new skills follow the same "cost constraint" pattern already established by
`sync-blueprint` (read the cheap, already-written summaries in `session-notes`; never re-read
or re-derive from source code or full git history) — consistent with how this project already
avoids expensive re-exploration for documentation-reconciliation work.

## Verification

Both skill files are well-formed (frontmatter `name`/`description` + markdown body, matching
`sync-blueprint`/`test-ai-pipeline`'s existing structure) and are already showing up as
available skills. Not yet exercised end-to-end (that happens the next time a session actually
starts or ends) — this step is the tooling setup, not a live run.

## Suggested commit title

`feat: add /review-session and /start-session skills, update CLAUDE.md workflow`
