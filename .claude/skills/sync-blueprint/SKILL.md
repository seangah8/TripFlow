---
name: sync-blueprint
description: Reconcile BLUE_PRINT.md and CLAUDE.md with what actually got built this session, using session-notes step summaries instead of re-reading source code. Run at the end of a session, after /code-review passes.
---

# /sync-blueprint

Versions rarely land exactly as `BLUE_PRINT.md` described going in — a decision gets made
mid-session (a library swapped, a piece of scope pulled forward or deferred, a field named
differently than proposed) and `BLUE_PRINT.md` quietly stops matching reality. This skill closes
that gap at the end of a session, cheaply — by reading the session's own already-written summaries
instead of re-reading the codebase.

## Cost constraint — read this first

**Never re-read the application source code to do this comparison.** The whole point of this
skill is that `session-notes/session-N/step-*.md` files already contain "what was built" and
"why" for every completed step, written at the time the decision was made. Treat those files as
the authoritative record of what happened this session. Do not `Grep`/`Read` backend or frontend
source files to verify their claims — if a step file says a field was added, believe it.

The only files this skill should read are:
- `session-notes/session-N/step-*.md` for the session being reconciled (all of them)
- The current `BLUE_PRINT.md`
- The current `CLAUDE.md`

## Procedure

1. **Identify the session.** Default to the highest-numbered `session-notes/session-N/` folder
   with step files newer than the last `/sync-blueprint` run (or just the most recent session if
   unclear). If it's ambiguous which session to reconcile, ask.

2. **Read every step file for that session.** These are short and already summarized — read all
   of them, not a sample.

3. **Read `BLUE_PRINT.md`'s section for that version** (the version table row in Section 2/4, and
   its detailed subsection in Section 3) and the relevant parts of `CLAUDE.md` (the version table,
   Section 7's locked architecture decisions, Section 9's skills table, and any workflow rule that
   might have shifted).

4. **Diff what was planned against what the step files describe.** Look specifically for:
   - Things `BLUE_PRINT.md` states that the step files show happened differently (a different
     library, a different endpoint shape, a decision reversed).
   - Things that happened this session but aren't mentioned anywhere in `BLUE_PRINT.md`/`CLAUDE.md`
     yet (new files, new tools, new skills, scope pulled forward from a later version or deferred
     to one).
   - Anything marked in the step files as an explicit, confirmed deviation (these are the easiest
     — they're usually already called out as such in the step summary or session context).

5. **Propose concrete edits.** For each diff, draft the specific `BLUE_PRINT.md`/`CLAUDE.md` text
   change (old → new), not just a description of the problem. Group them by file.

6. **Ask before writing.** Show the full set of proposed edits and get explicit confirmation
   before applying any of them — this project's workflow rule is "ask before deciding," and
   editing the source-of-truth spec is exactly that kind of decision.

7. **Apply confirmed edits** with `Edit`, then report a short summary of what changed and why.

## What NOT to do

- Don't edit `session-notes/**` — those are an append-only historical record, not something this
  skill reconciles or rewrites.
- Don't touch files this skill wasn't asked to reconcile (i.e., don't drift into general doc
  cleanup beyond the session's actual diffs).
- Don't silently apply edits without confirmation, even for what looks like an obvious fix.
- If a session's `step-*.md` files are missing or clearly incomplete, say so and stop — don't fall
  back to reading source code to fill the gap, since that defeats the purpose of this skill.
