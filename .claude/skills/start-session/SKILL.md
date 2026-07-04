---
name: start-session
description: Produces a quick, cheap briefing of where the project actually stands right now — current version, what the last session built, any outstanding follow-ups — using CLAUDE.md/BLUE_PRINT.md plus the latest session-notes instead of re-exploring the codebase. Run at the start of a new session, before /plan.
---

# /start-session

Getting oriented at the start of a session shouldn't require re-reading backend/frontend source
to figure out "where did we leave off." `session-notes/session-N/step-*.md` files already say
what was built, why, and what's still outstanding — this skill reads those (cheap) instead of
the application code (expensive) to produce a short briefing.

## Cost constraint — read this first

**Never read backend or frontend source files as part of this skill.** The only files this
skill reads are `CLAUDE.md`, `BLUE_PRINT.md`, and `session-notes/session-N/step-*.md` for the
most recent session(s). Do not run `typecheck`/`test`/`build`, and do not `Grep`/`Read` any file
under `backend/src/` or `frontend/src/` — if you find yourself reaching for one of those, stop;
this skill's job is orientation, not verification. Verification happens later, once real work
resumes, using whatever tools that work actually calls for.

## Procedure

1. **Read `CLAUDE.md` in full** — this is already mandatory at the start of every session per
   its own instructions, so this isn't extra cost; treat it as step one here too.

2. **Read `BLUE_PRINT.md` Section 2** (the version table) to see which versions are marked done
   and which is next. Read the current/next version's own subsection in Section 3 for its
   user-facing outcome and scope — skip sections for versions well in the past or far in the
   future unless something else points you there.

3. **Identify the most recent `session-notes/session-N/` folder** (highest `N`). Read every
   `step-*.md` file in it, including any `step-N-bugfix.md`/follow-up files — these are short
   and already summarized, so read all of them, not a sample.

4. **Do a cheap git check** — `git status` and `git log -5` (or similar) only. This is just to
   see whether the session's work has already been committed or is still sitting uncommitted;
   it is not a substitute for reading the step files, and it's not a diff review (that's
   `/review-session`'s job).

5. **Produce a short briefing** covering:
   - Which version the project is on, and whether the most recent session's steps look complete
     against `BLUE_PRINT.md`'s plan for that version (or if it's clearly mid-session, say so).
   - What was actually built last (one or two lines per step, not the full step file contents).
   - Anything the step files explicitly flagged as outstanding — pending browser verification,
     an external setup step the user still needs to do (an API key, a console setting), a
     deferred decision, a known bug.
   - A suggested next action: continue the in-progress session, run `/review-session` and
     `/sync-blueprint` to close it out, or start a new `/plan` for the next version.

## What NOT to do

- Don't treat this as a substitute for `/sync-blueprint` (that reconciles `BLUE_PRINT.md`/
  `CLAUDE.md` against what happened) or `/review-session` (that checks correctness) — this
  skill's only job is a cheap orientation briefing, not validation or doc reconciliation.
- Don't re-derive "what happened" from git log/diff across many commits — session-notes already
  records this more cheaply and with the reasoning intact.
- If `session-notes/` is empty or the most recent session has no step files at all, say so
  plainly and summarize from `CLAUDE.md`/`BLUE_PRINT.md` alone rather than falling back to
  reading source code to reconstruct history.

## When to run it

At the start of a new session, before running `/plan` for the next version or resuming
mid-session work — see CLAUDE.md §5.1.
