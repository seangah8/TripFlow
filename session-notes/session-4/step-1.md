# Session 4 (v4) — Step 1: `/sync-blueprint` skill

## What was built

- `.claude/skills/sync-blueprint/SKILL.md` — a new skill that, when run, reconciles
  `BLUE_PRINT.md`/`CLAUDE.md` with what actually got built in a session. It reads only that
  session's `session-notes/session-N/step-*.md` files (already-written "what + why" summaries)
  plus the current `BLUE_PRINT.md`/`CLAUDE.md`, diffs planned vs. actual, proposes concrete text
  edits, and asks for confirmation before writing. Explicitly forbidden from re-reading
  application source code, to keep it cheap.
- `CLAUDE.md` Section 9 (skills table) — registered `/sync-blueprint`.
- `CLAUDE.md` Section 5.5 (end-of-session reminders) — added `/sync-blueprint`, positioned right
  after `/code-review`.

## Why these decisions

- Scoped strictly to `session-notes` instead of source code, per the requirement to avoid burning
  tokens re-reading the whole codebase — the step summaries already capture the "what happened and
  why" at low cost.
- "Ask before writing" rather than auto-apply, to stay consistent with this project's
  "ask before deciding" rule — edits to the source-of-truth spec docs are exactly the kind of
  decision that rule is meant to cover.
- Left Section 7's "Zustand (from v4)" line untouched for now — that correction is exactly the
  kind of drift this new skill exists to catch and fix at the end of the session (Step 14), not
  something to hand-patch now.

**Suggested commit title:** `feat: add /sync-blueprint skill for reconciling docs with session-notes`
