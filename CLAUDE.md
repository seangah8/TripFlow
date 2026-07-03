# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Read this file completely at the start of every session before doing anything else.

---

## 1. What this project is

**TripFlow** — an AI-assisted vacation planner, built as a sequence of versions (v0–v9, with a speculative v10), each a complete working slice — backend and frontend together. The app fetches real places from Google Places, groups them into days by geographic proximity (deterministic algorithm, from v3), and — from v5 onward — uses Claude to curate and explain the best stops for the whole trip before clustering ever runs.

**Full spec lives in `BLUE_PRINT.md`** — the versioned build plan, schema, and API contract are there. CLAUDE.md is the workflow guide; BLUE_PRINT.md is the source of truth for what we're building and in what order.

---

## 2. Project structure

```
TripFlow/
├── CLAUDE.md               ← this file (workflow guide)
├── BLUE_PRINT.md           ← full versioned spec (read this for decisions)
├── FUTURE_SCOPE.md         ← things genuinely out of scope
├── LEARNINGS.md            ← append-only log, one entry per session
├── session-notes/          ← one folder per session, one file per completed step
│   └── session-1/          ← Session N ships version vN (Session 1 → v1, Session 2 → v2, ...)
│       ├── step-1.md
│       └── ...
├── .claude/
│   └── skills/
│       ├── log-learning/
│       │   └── SKILL.md
│       └── test-ai-pipeline/
│           └── SKILL.md
├── backend/               ← Node.js + Express + TypeORM
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   │   └── data-source.ts
│   │   ├── entities/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   ├── seeds/
│   │   ├── types/
│   │   └── utils/
│   ├── .env               ← gitignored, real credentials
│   └── .env.example       ← committed, safe template
└── frontend/              ← Vite + React + TypeScript
    └── src/
        ├── pages/
        ├── components/
        ├── hooks/
        └── types/
```

---

## 3. Common commands

```bash
# Install all deps (run once, or after pulling changes)
npm install --prefix frontend && npm install --prefix backend

# Development (run each in a separate terminal)
npm run dev --prefix backend     # Express on port 3001
npm run dev --prefix frontend    # Vite on port 5173

# Seed the database with one placeholder place
npm run seed --prefix backend

# Type-check only (no emit)
npm run typecheck --prefix backend
npm run typecheck --prefix frontend

# Tests (introduced at v3, when clustering.ts is the first pure-function piece worth testing)
npm test --prefix backend
npm test --prefix frontend
npm test --prefix backend -- --testPathPatterns=clustering   # single file — Jest 30 flag name
```

---

## 4. Version build sequence

One version per session. Each version must end with something running in a browser — no version ships backend-only work with nothing visible.

| Session | Version | Goal |
|---------|---------|------|
| 0 | v0 | Scaffold + toolchain: DB ↔ backend ↔ frontend proven, one seeded place |
| 1 | v1 | City input + Generate button + real Google Places on a map. No dates, no AI. |
| 2 | v2 | Date range + day timeline; trip persisted; places randomly split across days |
| 3 | v3 | Real K-means clustering replaces the random split |
| 4 | v4 | Preferences wizard drives the Google Places search |
| 5 | v5 | Claude curates the whole pool before clustering runs |
| 6 | v6 | Claude adds time estimates + reasoning; stop list + detail panel in the UI |
| 7 | v7 | Auth, trips dashboard, Google Maps export |
| 8 | v8 | Opening-hours awareness (drop/reassign stops by day) |
| 9 | v9 | Hotel-anchored clustering + real stop ordering |
| 10 *(speculative)* | v10 | `Vacation` wraps multiple single-city `Trip`s — multi-city support with zero changes to v1–v9's logic |

See `BLUE_PRINT.md` Section 3 for the full detail per version.

---

## 5. The workflow — read this carefully

This is the most important section. Every session must follow this flow exactly.

---

### 5.1 Starting a session

1. Run `/plan` — always, before writing a single line of code.
2. The plan must include:
   - The user-facing outcome: what the user can see or do in the browser by the end. **This can never be "nothing visible" — if a version's plan doesn't produce something demoable, the scope is wrong; split it differently.**
   - A full folder tree marking new files vs. existing files
   - A numbered list of steps (these become the step-by-step guide for the session)
3. Wait for the user to approve the plan before starting Step 1.

---

### 5.2 During every step — the rules that matter most

**Ask before deciding — always, without exception.**
Before implementing any decision — a field name, a library choice, a folder structure, a function signature, a nullable vs. required field, anything where more than one valid option exists — stop and ask the user. Do not build first and ask for corrections after.

**Share your thinking when you ask.**
Don't just present two options and ask "which do you prefer?" — explain your own preference and why, then ask.

**Never silently diverge from BLUE_PRINT.md.**
If something in BLUE_PRINT.md conflicts with what you're about to build, flag it explicitly and ask how to resolve it. Do not change the approach silently.

**Don't build ahead of the current version.**
If a piece of a later version's feature would be easy to bolt on early (e.g. opening-hours filtering while building v3's clustering), don't. Each version's scope is deliberately narrow — that's what keeps every version demoable and reviewable on its own.

---

### 5.3 At the start of each step — show the map

Before doing any work on a new step, always print the full step list for the current session with status indicators:

```
Session N (v1) — Steps:
✅ Step 1: ...
🔄 Step 2: ...   ← we are here
⏳ Step 3: ...
```

---

### 5.4 At the end of each step — checkpoint

After completing a step, do all four of the following, in this order, before touching anything else:

1. **Post the step summary in the chat response first.** Must include: what was built, why each decision was made, a suggested commit title (suggestion only — never run `git commit` unless explicitly asked).
2. **Then write that same step summary** to `session-notes/session-N/step-N.md`.
3. **Ask the checkpoint question:** "Is everything clear? Does everything seem correct to you? Ready to move to the next step?"
4. **Wait for confirmation** before starting the next step. Do not proceed automatically.

---

### 5.5 End of session — script reminders

| Script | When | Why |
|--------|------|-----|
| `/code-review` | After the last step of every session | Checks the diff for correctness bugs |
| `/log-learning` | After `/code-review` passes | Appends a dated entry to `LEARNINGS.md` |
| `/security-review` | Before v9 (final submission) | Checks for injection, XSS, exposed credentials |
| `/test-ai-pipeline` | After any change to the AI pipeline (v5 onward) | Re-runs the pipeline against a fixed test input |

---

### 5.6 Mid-session reminders

Remind the user to run `/test-ai-pipeline` whenever a file in any of these locations changes (relevant from v3 for clustering, v5 for the rest):
- `backend/src/api/services/placesService.ts`
- `backend/src/api/services/claudeService.ts`
- `backend/src/api/services/tripService.ts`
- `backend/src/utils/clustering.ts`

---

## 6. Code style

### Comments
Write comments freely when the **why** is non-obvious — a hidden constraint, a subtle invariant, a workaround, a tricky algorithm step, or anything that would make a reader stop and wonder "why is this done this way?" Place comments on the line directly above the code they explain. Do not comment what the code does — well-named identifiers handle that.

### TypeScript
- Always use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `!` (non-null assertion) only when the value is guaranteed by the surrounding logic — comment why if it isn't obvious
- TypeORM `@Column()` decorators must always specify an explicit column type (`@Column('varchar')`, `@Column('uuid')`, `@Column('int')`, etc.), never a bare `@Column()` — `tsx`/esbuild doesn't reliably emit the decorator metadata TypeORM needs to infer it, and a bare `@Column()` crashes at startup with `ColumnTypeUndefinedError`.
- `tsconfig.json` uses `"module"`/`"moduleResolution": "NodeNext"` with `"isolatedModules": true` — a type used only in a decorated property's signature (e.g. `TripPreferences` on `Trip.preferences`) must be imported with `import type`, not a plain `import`, or `tsc` fails with TS1272.

### Naming
- Files: `camelCase.ts` for utilities, `PascalCase.ts` for entities and React components
- Database columns: `snake_case` (TypeORM maps these automatically)
- API response fields: `camelCase`

---

## 7. Architecture decisions (locked)

See `BLUE_PRINT.md` Section 7 for the full list with version tags. Summary:

1. **Places come from Google Places — Claude only curates (from v5).**
2. **Clustering is deterministic code, not the LLM (from v3).**
3. **Zustand (from v4) + TanStack Query (from v1). No Redux.**
4. **`trip_stops` is the single source of truth** once it exists (v2+).
5. **Build in vertical slices — every version ends with something running in a browser.**
6. **Opening hours are always in local city time (from v8).** No timezone conversion, no timezone fields.

---

## 8. session-notes structure

One folder per session, one file per completed step — unchanged mechanism from the original workflow. Session N's folder documents the work that shipped version vN.

```
session-notes/
├── session-0/   ← shipped v0
│   ├── step-1.md
│   └── ...
├── session-1/   ← shipped v1
│   └── ...
```

Never write a step file speculatively or mid-step.

---

## 9. Custom skills

| Skill | When to use |
|-------|-------------|
| `/log-learning` | End of every session — appends a dated entry to `LEARNINGS.md` |
| `/test-ai-pipeline` | After any change to the AI pipeline files (v3 for clustering, v5+ for the rest) |

---

## 10. Out of scope

See `FUTURE_SCOPE.md` — editable/draggable plans, multi-user/shared trips, city-level place caching, notifications, mobile app. Everything else discussed for this project has a version number in `BLUE_PRINT.md` (including multi-city trips, now speculative v10).
