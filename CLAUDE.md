# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Read this file completely at the start of every session before doing anything else.

---

## 1. What this project is

**TripFlow** — an AI-assisted vacation planner. The user provides a city, travel dates, and preferences. The app fetches real places from Google Places, groups them into days by geographic proximity (deterministic algorithm), and uses Claude to select, order, and explain the best stops for each day.

**Full spec lives in `BLUE_PRINT.md`** — all schema details, API contracts, UI flows, session plans, and architectural decisions are there. Read it when you need specifics. CLAUDE.md is the workflow guide; BLUE_PRINT.md is the source of truth for what we're building.

---

## 2. Project structure

```
TripFlow/
├── CLAUDE.md              ← this file (workflow guide)
├── BLUE_PRINT.md                ← full project spec (read this for decisions)
├── LEARNINGS.md           ← append-only log, one entry per session
├── session-notes/         ← one folder per session, one file per completed step
│   └── session-0/
│       ├── step-1.md
│       ├── step-2.md
│       └── ...
├── .claude/
│   └── skills/
│       ├── log-learning.md
│       └── test-ai-pipeline.md
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
│   │   ├── middleware/
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

# Tests
npm test --prefix backend
npm test --prefix frontend
npm test --prefix backend -- --testPathPattern=clustering   # single file
```

---

## 4. Session build sequence

| Session | Name | Goal |
|---------|------|------|
| 0 | Scaffold + Toolchain | Scaffold backend + frontend, connect Postgres, prove data flows DB → API → screen |
| 1 | Backend AI Pipeline | Google Places → clustering → Claude → saves to DB. Verified via curl/Postman, no frontend yet |
| 2 | Frontend Wizard + Plan Display | 3-step wizard + plain plan list. Full pipeline visible in browser for first time |
| 3 | Persistence + Auth | Register/login, save/load trips, trips list screen |
| 4 | Map + Export | Map layout, day timeline, stop detail panel, Google Maps export link |
| 5 | Polish | Loading states, error handling, edge cases, UI refinement |

Each session has a `/plan` at the start. See `BLUE_PRINT.md` Section 9 for the detailed breakdown of each session.

---

## 5. The workflow — read this carefully

This is the most important section. Every session must follow this flow exactly.

---

### 5.1 Starting a session

1. Run `/plan` — always, before writing a single line of code.
2. The plan must include:
   - The user-facing outcome: what the user can see or do in the browser by the end
   - A full folder tree marking new files vs. existing files
   - A numbered list of steps (these become the step-by-step guide for the session)
3. Wait for the user to approve the plan before starting Step 1.

---

### 5.2 During every step — the rules that matter most

**Ask before deciding — always, without exception.**
Before implementing any decision — a field name, a library choice, a folder structure, a function signature, a nullable vs. required field, anything where more than one valid option exists — stop and ask the user. Do not build first and ask for corrections after.

**Share your thinking when you ask.**
Don't just present two options and ask "which do you prefer?" — explain your own preference and why, then ask. Example: "I'd go with X because [reason], but Y is also valid because [reason]. Which do you want?" The user wants to make the final call but also wants to understand your reasoning.

**Never silently diverge from BLUE_PRINT.md.**
If something in BLUE_PRINT.md conflicts with what you're about to build, flag it explicitly and ask how to resolve it. Do not change the approach silently.

---

### 5.3 At the start of each step — show the map

Before doing any work on a new step, always print the full step list for the current session with status indicators:

```
Session 0 — Steps:
✅ Step 1: Git init + .gitignore
✅ Step 2: Backend scaffold
🔄 Step 3: Environment config   ← we are here
⏳ Step 4: TypeORM DataSource + entities
⏳ Step 5: Express app + routes
⏳ Step 6: Seed
⏳ Step 7: Frontend scaffold
⏳ Step 8: Frontend fetch + display
⏳ Step 9: /log-learning skill
⏳ Step 10: LEARNINGS.md
⏳ Step 11: Verify end-to-end
```

---

### 5.4 At the end of each step — checkpoint

After completing a step, do all four of the following, in this order, before touching anything else:

1. **Post the step summary in the chat response first.** The summary must include:
   - What was built (files created or changed)
   - Why each decision was made (not what the code does — why those specific choices)
   - A suggested commit title for the step — short, focused on the main change. This is a suggestion only; do not actually run `git commit` unless the user explicitly asks.

2. **Then write that same step summary** (including the suggested commit title) to `session-notes/session-N/step-N.md`.

3. **Ask the checkpoint question:**
   > "Is everything clear? Does everything seem correct to you? Ready to move to the next step?"

4. **Wait for confirmation** before starting the next step. Do not proceed automatically.

---

### 5.5 End of session — script reminders

At the end of every session, remind the user to run these in order:

| Script | When | Why |
|--------|------|-----|
| `/code-review` | After the last step of every session | Checks the diff for correctness bugs |
| `/log-learning` | After `/code-review` passes | Appends a dated entry to `LEARNINGS.md` |
| `/security-review` | Before Session 5 (final submission) | Checks for injection, XSS, exposed credentials |
| `/test-ai-pipeline` | After any change to the AI pipeline (Sessions 1, 2) | Re-runs the pipeline against a fixed test input to catch regressions |

---

### 5.6 Mid-session reminders

Remind the user to run `/test-ai-pipeline` whenever a file in any of these locations changes:
- `backend/src/api/services/placesService.ts`
- `backend/src/api/services/claudeService.ts`
- `backend/src/api/services/tripGenerationService.ts`
- `backend/src/utils/clustering.ts`

---

## 6. Code style

### Comments
Write comments freely when the **why** is non-obvious — a hidden constraint, a subtle invariant, a workaround, a tricky algorithm step, or anything that would make a reader stop and wonder "why is this done this way?"

Place comments on the line directly above the code they explain. For functions or blocks that have non-obvious behavior, write a short comment above the function explaining the key thing to know.

Do not comment what the code does — well-named identifiers handle that. Comments explain intent and reasoning, not mechanics.

### TypeScript
- Always use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `!` (non-null assertion) only when the value is guaranteed by the surrounding logic — add a comment explaining why if it isn't obvious
- TypeORM `@Column()` decorators must always specify an explicit column type (e.g. `@Column('varchar')`, `@Column('uuid')`, `@Column('int')`), never a bare `@Column()`. The backend runs on `tsx`, which uses esbuild — esbuild doesn't reliably emit the decorator metadata TypeORM needs to infer a column type from the TS property type, and a bare `@Column()` crashes the app at startup with `ColumnTypeUndefinedError`.

### Naming
- Files: `camelCase.ts` for utilities, `PascalCase.ts` for entities and React components
- Database columns: `snake_case` (TypeORM maps these automatically with `@Column()` naming)
- API response fields: `camelCase`

---

## 7. Architecture decisions (locked)

These are fixed. If a genuine technical conflict forces a change, flag it and discuss — do not silently diverge.

**1. Places come from Google Places — Claude only curates.**
Claude never invents places. It selects, orders, and reasons about the real places it was given. This makes hallucinated venues structurally impossible.

**2. Clustering is deterministic code, not the LLM.**
K-means in `backend/src/utils/clustering.ts`. Same input always produces the same output. See BLUE_PRINT.md Section 7 for the algorithm details.
Principle: **deterministic where correctness matters, LLM where judgment and language matter.**

**3. Zustand (client state) + TanStack Query (server state). No Redux.**
- Zustand: wizard form fields, active day, selected stop ID, UI flags
- TanStack Query: all API data (places, trips, generated plans) — caching, loading, errors included
- `useState`: single-component local state only

**4. `trip_stops` is the single source of truth for the generated plan.**
The LLM response maps directly to `trip_stops` rows — no raw response copy stored in the DB. If raw output is needed for debugging, log it to the console at that moment.

**5. Start date and end date are required before generating a plan.**
The actual calendar date of each stop determines the day of week, which determines which places are open. A plan cannot be generated without knowing the travel dates.

**6. Opening hours are always in local city time.**
Google Places returns hours in the local time of the place's location. No timezone conversion is ever needed. Do not add timezone fields to the schema.

---

## 8. session-notes structure

One folder per session, one file per completed step. Only write a step file after the user has confirmed the step is done.

```
session-notes/
├── session-0/
│   ├── step-1.md    ← written after user confirms step 1 is done
│   ├── step-2.md
│   └── ...
├── session-1/
│   └── ...
```

Each step file contains:
- What was built
- Why each decision was made

Never write a step file speculatively or mid-step.

---

## 9. Custom skills

| Skill | When to use |
|-------|-------------|
| `/log-learning` | End of every session — appends a dated entry to `LEARNINGS.md` in two sections: Domain/Stack and Claude Code Usage |
| `/test-ai-pipeline` | After any change to the AI pipeline files (see Section 5.6) — re-runs the full pipeline against a fixed test input |

---

## 10. Out of scope for v1

- Multi-user / shared trips
- Editable / draggable plan
- In-app routing between stops (TSP optimization)
- City-level place caching
- Hotel-anchored clustering (future version — see BLUE_PRINT.md Section 11)
- Multi-city trips
- Mobile app
