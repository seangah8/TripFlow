# Session 0 — Step 7: Frontend scaffold

## What was built
- Scaffolded `frontend/` via `npm create vite@latest frontend -- --template react-ts`.
- Installed `@tanstack/react-query` (no zustand yet, per earlier decision — there's no client state to manage until the wizard exists in Session 2).
- Added a `typecheck` script (`tsc -b`) to `frontend/package.json` — matches the command already documented in `CLAUDE.md` Section 3; the template only shipped `build`/`lint`/`dev`/`preview`.
- **CORS instead of a Vite dev proxy.** `frontend/vite.config.ts` stays at Vite's plain default (no `server.proxy`). Backend installs `cors` (+ `@types/cors`), and `backend/src/server.ts` does `app.use(cors({ origin: process.env.CORS_ORIGIN }))`. Added `CORS_ORIGIN=http://localhost:5173` to `backend/.env` + `.env.example`. `frontend/.env` keeps `VITE_API_URL=http://localhost:3001` — the frontend will call this URL directly via `fetch()` in Step 8.
- **Updated `BLUE_PRINT.md` Section 4**, which explicitly documented "Frontend calls via Vite proxy (no CORS needed in dev)" — now reads: "Frontend calls the backend directly at `VITE_API_URL`... the backend enables CORS for the frontend's origin (`CORS_ORIGIN`)."
- **Split `.gitignore` into per-project files.** Deleted the root `.gitignore`. `frontend/.gitignore` (already created by `create-vite`) got `.env` added explicitly — it only had `*.local`, which doesn't match plain `.env`, so `.env` was silently relying on the root file before this fix. New `backend/.gitignore` covers `node_modules/`, `dist/`, `.env`, `*.log`.

## Verification
- `npm run typecheck` clean on backend.
- `git check-ignore -v` confirms both `.env` files and both `node_modules` directories are still ignored after the split.
- `git add --dry-run frontend/` shows only real source/config files staged — no `node_modules`, `.env`, or `dist`.
- Backend restarted cleanly under `tsx watch` after the `server.ts` change; `curl -H "Origin: http://localhost:5173" http://localhost:3001/api/health` returns `Access-Control-Allow-Origin: http://localhost:5173` — a fixed allow-listed origin, not a wildcard or a reflection of the caller's origin.
- Frontend dev server auto-restarted cleanly after the `vite.config.ts` change; confirmed still serving on `:5173`.

## Why these decisions were made
- Switched proxy → CORS per your explicit request; this reverses what `BLUE_PRINT.md` originally specified, so the doc was updated rather than left silently inconsistent with the code (per `CLAUDE.md` Section 5.2's "never silently diverge" rule) — you're the one calling this change, so it's a deliberate blueprint update, not a divergence.
- `CORS_ORIGIN` is a static configured value (not a wildcard `*`, not reflecting the request's `Origin` header) — the `cors` package only ever returns this one allow-listed origin, so only requests actually originating from `http://localhost:5173` will have their responses readable by browser JS.
- Per-project `.gitignore` files keep each project's ignore rules next to the project they apply to, and made visible a real gap (frontend's own scaffolded `.gitignore` didn't actually cover `.env`) that the root file had been silently papering over.

## Suggested commit title
`refactor: switch frontend<->backend from Vite proxy to CORS; split .gitignore per project`
