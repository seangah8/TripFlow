# Session 0 — Step 1: Git init + .gitignore

## What was built
- Ran `git init`. A git repo already existed (with a GitHub remote at `https://github.com/seangah8/TripFlow.git` and one prior commit containing `CLAUDE.md` + `BLUE_PRINT.md`), so this was a safe no-op — confirmed via `git status`, `git remote -v`, and `git log`.
- Added `.gitignore` at the project root: `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `*.log`, `.vite/`.

## Why these decisions were made
- One root-level `.gitignore` rather than one per `backend/`/`frontend/` — both projects share the same ignore patterns (node_modules, build output, env files), so a single file at the root covers both without duplication.
- `.env` is ignored (not `.env.example`) per the project structure in `CLAUDE.md` Section 2 — `.env` holds real local Postgres credentials and must never be committed; `.env.example` is the safe, committed template that gets created in Step 3.
