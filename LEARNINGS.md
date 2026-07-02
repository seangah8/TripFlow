# LEARNINGS

Append-only log, one dated entry per session, added by running `/log-learning` at the end of each session (see `CLAUDE.md` Section 9 and `.claude/skills/log-learning/SKILL.md`).

Each entry has two sections: `Domain/Stack` (tech-stack/domain gotchas) and `Claude Code Usage` (what worked or didn't in the workflow itself).

## 2026-07-02 — Session 0

### Domain/Stack
- `tsx`/esbuild doesn't reliably emit the decorator metadata TypeORM needs to infer a column type from a bare `@Column()`. Every TypeORM `@Column()` must specify an explicit type string (`@Column('varchar')`, `@Column('uuid')`, `@Column('int')`, etc.) or the app crashes at startup with `ColumnTypeUndefinedError`. Now documented as a permanent rule in `CLAUDE.md`.
- Postgres `decimal`/`numeric` columns come back from `node-postgres`/TypeORM as strings, not numbers (precision-safety default) — a `ValueTransformer` is needed to get real JS numbers matching the API contract's shape.
- The `cors` npm package (v2.8.6), when given `origin: undefined` (e.g. an unset `CORS_ORIGIN` env var), does **not** fail open to a wildcard/permissive default — it fails *closed*, silently disabling CORS entirely so no `Access-Control-Allow-Origin` header is ever sent, blocking every cross-origin request including legitimate ones. Verified by reading the installed package source directly; four independent review-agent passes had all assumed the opposite (fail-open) direction.
- `tsx watch` on Windows has a flaky `EADDRINUSE` crash-loop under rapid successive file saves (multiple files edited within seconds of each other) — self-heals on the next file-save trigger. Confirmed unrelated to application code: added a shutdown handler suspected of causing it, then fully reverted it, and the same crash-loop still occurred in both states, then stopped once edits paused. Treat as tooling noise during a fast edit burst, not a code bug.
- Claude Code custom skills must live at `.claude/skills/<name>/SKILL.md` (a folder), not a flat `.claude/skills/<name>.md` file. The flat-file form silently fails to register as a slash command — no error, it just never appears in the skill list. `CLAUDE.md`'s own Section 2 project-structure diagram had documented the wrong (flat) layout; corrected there too.

### Claude Code Usage
- Multi-agent code-review consensus isn't proof — four separate finder angles independently reported the same wrong mechanism (CORS "wildcard" instead of "disabled") for the same bug. The verification pass that actually read the installed dependency's source code caught it. Trust primary sources over agent agreement when the claim is checkable.
- A plausible-sounding fix isn't necessarily the right one — reasoned that a graceful-shutdown handler explained the `tsx watch` `EADDRINUSE` issue, applied it, and the problem persisted; only reverting *and re-testing* (not just reverting) revealed the original theory was wrong. Worth re-verifying after reverting a suspected fix, not just assuming a plausible theory was correct.
- This session's user consistently corrected scope creep in real time — extra files/types/abstractions added without being asked (a `types/index.ts` before it was wanted, an env-validation helper addressing real bugs but seen as over-engineering) were reliably walked back. Staying strictly inside the currently-approved step/plan boundaries, and asking before adding anything beyond it — even small "obviously needed" additions — avoided repeated rework this session and is worth defaulting to from the start next time.
