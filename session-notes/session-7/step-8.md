# Session 7 (v7) — Step 8: Backend dependencies + env vars

## What was built

Nothing new — this step's scope was already fully satisfied incrementally across Steps 3-6:
`bcryptjs`/`jsonwebtoken` were installed in Step 3 (`authService.ts`), `cookie-parser`/
`@types/cookie-parser` in Steps 4/6 (`authMiddleware.ts`/`server.ts`), and the `JWT_SECRET` env
var in Step 6 (`server.ts`). Each landed in the same step as the file that first needed it,
matching this project's existing precedent (`claudeService.ts`/`@anthropic-ai/sdk` in session
5) of installing a dependency alongside the code that requires it rather than batching installs
into one dedicated step at the end.

## Verification

- `backend/package.json`: `bcryptjs`, `cookie-parser`, `jsonwebtoken` present in
  `dependencies`; `@types/cookie-parser`, `@types/jsonwebtoken` present in `devDependencies`
  (`bcryptjs` ships its own types, no separate `@types/bcryptjs` needed).
- `backend/.env.example`: `JWT_SECRET` present under a `# --- Auth ---` section.

This closes out all backend work for v7 — Steps 9 onward are frontend.

## Suggested commit title

N/A — no new changes this step.
