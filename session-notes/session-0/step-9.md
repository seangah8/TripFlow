# Session 0 — Step 9: /log-learning skill

## What was built
- `.claude/skills/log-learning.md` — a custom Claude Code skill that, when invoked as `/log-learning`, appends a dated entry to `LEARNINGS.md` with two sections: `Domain/Stack` and `Claude Code Usage`.
- The file contains instructions, not content — it tells Claude how to review the session's work (conversation + `session-notes/session-N/step-*.md`) and extract genuine learnings, not a changelog restating what was built.

## Why these decisions were made
- Matches `CLAUDE.md` Section 9 exactly: this skill is the mechanism behind the end-of-session reminder in Section 5.5.
- Explicitly instructed to skip filler ("Nothing notable this session" instead of inventing content) — so future runs don't accumulate noise just to fill out the two sections every time nothing genuinely new was learned.
- Doesn't touch `LEARNINGS.md` itself yet — that file gets its skeleton in Step 10, and its first real entries only when `/log-learning` is actually run at the end of this session.

## Suggested commit title
`chore: add /log-learning custom skill`
