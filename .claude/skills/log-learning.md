---
name: log-learning
description: Append a dated entry to LEARNINGS.md summarizing this session's learnings, in two sections (Domain/Stack, Claude Code Usage). Run at the end of every session, after /code-review passes.
---

# /log-learning

Append one dated entry to `LEARNINGS.md` at the project root, summarizing what was learned in this session. Run this at the end of every session, after `/code-review` has passed (see `CLAUDE.md` Section 5.5).

## What counts as a "learning"

Not a changelog of what was built — that's what `session-notes/` and git history are for. A learning is something that would change how a future session approaches similar work: a gotcha, a constraint discovered the hard way, a tool/library quirk, a decision that turned out right (or wrong) and why.

Skip anything obvious, already documented in `CLAUDE.md`/`BLUE_PRINT.md`, or that wouldn't change anyone's future behavior.

## Format

Append (don't overwrite) a new entry at the end of `LEARNINGS.md`:

```markdown
## YYYY-MM-DD — Session N

### Domain/Stack
- Learning about the tech stack, libraries, or the app's domain (Postgres/TypeORM quirks, Google Places/Claude API behavior, clustering edge cases, etc.)

### Claude Code Usage
- Learning about the workflow itself — what worked or didn't in how this session was planned, executed, or reviewed with Claude Code.
```

Use today's actual date and the current session number. If a section has nothing genuinely worth recording, write "- Nothing notable this session" rather than inventing filler.

## How to gather the entries

Review this session's conversation and `session-notes/session-N/step-*.md` files for:
- Bugs hit and fixed, and *why* they happened (not just that they were fixed)
- Any point where the initial approach had to change
- Anything surprising about a library, API, or tool used this session

Draft the entries, then write them to `LEARNINGS.md`.
