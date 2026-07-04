# Session 7 (v7) — Step 6: Wire cookies + credentialed CORS into `server.ts`

## What was built

- `backend/src/server.ts` — added `cookie-parser` middleware, changed CORS to
  `cors({ origin: process.env.CORS_ORIGIN, credentials: true })` (required for the browser to
  send/accept the cookie across the 5173/3001 port difference), mounted `authRoutes`.
- `backend/.env` / `.env.example` — added `JWT_SECRET` under a new `# --- Auth ---` section
  (a random 32-byte hex secret for the real `.env`; a placeholder in `.env.example`). Added now
  rather than deferred to Step 8, since this step needed a real value to actually test against.

## Why these decisions

- `credentials: true` on CORS is a hard requirement, not an enhancement — without it, the
  browser silently drops the `Set-Cookie` response header and never sends the cookie back on
  subsequent requests, which would make every "am I logged in" check fail even though the
  server-side logic is entirely correct.

## Verification (ran the real backend against Postgres, not just typecheck)

- `POST /api/auth/register` (new email) → `201`, `Set-Cookie` with `HttpOnly; SameSite=Lax`,
  body `{"user":{"id":...,"email":...}}` — no `passwordHash` leaked.
- `POST /api/auth/register` (same email again) → `409`.
- `POST /api/auth/login` (wrong password) → `401`.
- `GET /api/auth/me` with the cookie → `200` + correct user.
- `GET /api/auth/me` with no cookie → `401`.
- `POST /api/auth/logout` → `200`, cookie cleared (`Set-Cookie: token=; Expires=1970...`).
- `GET /api/auth/me` with the now-stale cookie → `401`.

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: wire cookie-parser, credentialed CORS, and authRoutes into server.ts`
