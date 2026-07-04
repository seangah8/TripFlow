---
name: review-session
description: Reviews only the current (or a named) session's changes for correctness bugs, scoped via session-notes/session-N's step files instead of the whole repo or branch. The lightweight, cheap replacement for a full /code-review pass at the end of a session.
---

# /review-session

A full `/code-review` spawns multiple parallel finder/verifier subagents across whatever the
diff happens to contain — appropriate for a big milestone, wasteful for "did today's dozen-file
version land cleanly." This skill reviews exactly the files a session touched, using the
session's own already-written step summaries to know what that scope is, instead of scanning
the whole working tree or branch diff.

## Cost constraint — read this first

**Never scan the whole repo or branch diff to find scope.** The whole point of this skill is
that `session-notes/session-N/step-*.md` files already state which files each step touched.
Build the exact file list from those summaries, then review only those files — don't `git diff`
the entire branch and don't `Grep` around the codebase looking for "what else might be
related."

**Don't spawn a multi-agent finder/verifier fleet.** A single focused review pass over an
already-known, narrow file list is enough — this project runs on a limited API budget (see
CLAUDE.md's cost note on `/code-review`), and the whole reason this skill exists is to avoid
that cost for routine per-session checks.

## Procedure

1. **Identify the session.** Default to the highest-numbered `session-notes/session-N/` folder.
   If the user names a specific session or step range, use that instead. If it's ambiguous
   (e.g. two sessions look equally recent), ask.

2. **Read every step file for that session** (all of them, not a sample) — including any
   `step-N-bugfix.md`/`step-N-*.md` follow-up files. Each one already states what files were
   built or changed; collect the full, deduplicated file list from these statements. Do not
   supplement this list by grepping the codebase for "related" files.

3. **Get the actual diff for exactly that file list:**
   - For files git already tracks and that were modified: `git diff -- <path1> <path2> ...`
     (pass every path from the list in one call).
   - For files the step notes describe as newly created: check `git status` — if untracked,
     `Read` the file directly (the "diff" is its entire content, since it's new).
   - If a file the notes mention no longer exists or wasn't actually touched per `git status`,
     note the discrepancy rather than silently dropping it.

4. **Review the collected diff for correctness bugs** — the same lens `/code-review` uses
   (wrong logic, edge cases the code doesn't handle, type mismatches papered over with `as`,
   broken error handling), not simplification/style/efficiency cleanup. Keep this to a single
   pass at low/medium effort: a handful of high-confidence findings, not an exhaustive multi-angle
   search.

5. **Report findings** with the `ReportFindings` tool (file, line, one-sentence summary, concrete
   failure scenario), ranked most-severe first. An empty list is a valid, good outcome — say so
   plainly rather than manufacturing a finding.

## Fallback: no session-notes yet

If the current session has no `step-*.md` files yet (e.g. reviewing mid-step, before any
checkpoint has been written), fall back to `git diff` against the working tree for uncommitted
changes only — still don't scan committed history or the whole branch. Say explicitly that
you're using this fallback instead of the session-notes-scoped file list.

## What NOT to do

- Don't re-derive scope from `git log` across many commits — session-notes already records this
  cheaply.
- Don't read or diff files outside the session's own file list "just in case."
- Don't use Opus-tier models for this — same reasoning as `/code-review`'s existing cost note in
  CLAUDE.md.
- If step files are missing or clearly incomplete for the session being reviewed, say so and use
  the fallback above rather than quietly scanning the whole repo to compensate.

## When to run it

At the end of every session, in place of `/code-review` (see CLAUDE.md §5.5) — `/code-review`
remains available to invoke directly any time a deeper, full-branch multi-agent pass is wanted
(e.g. before a major milestone or before merging to main), but it's no longer the routine
per-session step.
