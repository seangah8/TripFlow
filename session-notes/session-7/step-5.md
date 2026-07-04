# Session 7 (v7) — Step 5: `authController.ts` + `authRoutes.ts`

## What was built

- `backend/src/api/controllers/authController.ts` (new):
  - `registerHandler`/`loginHandler` — shallow presence/type validation (matching
    `tripController.ts`'s existing convention), call the service, on success set an httpOnly
    session cookie (`sameSite: 'lax'`, 24h `maxAge`) and respond with `{ user }`. Catch
    `EmailAlreadyRegisteredError` → 409, `InvalidEmailError`/`WeakPasswordError` → 400,
    `InvalidCredentialsError` → 401, everything else → 500.
  - `logoutHandler` — clears the cookie, no auth required (logging out twice is harmless).
  - `meHandler` — behind `authMiddleware`, re-looks-up the user by `req.userId` (401 if the row
    was deleted after the token was issued), returns `{ user }`.
- `backend/src/api/routes/authRoutes.ts` (new) — `POST /auth/register`, `POST /auth/login`,
  `POST /auth/logout`, `GET /auth/me` (`authMiddleware` applied only to this one route, since
  it's the sole route in this file that needs it).

## Why these decisions

- `setSessionCookie` is a small shared helper (not duplicated between register/login) — both
  endpoints set the identical cookie on success, so there's one place that owns the cookie's
  actual options.
- `meHandler`'s re-lookup (rather than just trusting the JWT payload) exists because a valid,
  unexpired token doesn't guarantee the user still exists — this is the one place that gap would
  actually surface to a client.
- Neither `authRoutes.ts` nor `authController.ts` is wired into `server.ts` yet, so none of this
  is reachable by a real request until Step 6 mounts the router and Step 6/7 make the cookie
  machinery (cookie-parser, credentialed CORS) actually functional end-to-end.

## Verification

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: add authController.ts and authRoutes.ts`
