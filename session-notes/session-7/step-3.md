# Session 7 (v7) — Step 3: `authService.ts`

## What was built

- `backend/src/api/services/authService.ts` (new):
  - `registerUser(email, password)` — validates email format (regex) and an 8-character
    password minimum, checks for an existing email (throws `EmailAlreadyRegisteredError` if
    found), hashes with `bcrypt.hash(password, 12)`, saves the `User`, signs a JWT, returns
    `{ user, token }`.
  - `loginUser(email, password)` — looks up by email, `bcrypt.compare`s; a missing email or a
    wrong password both throw the same `InvalidCredentialsError`, so a failed login never
    reveals which emails are actually registered.
  - `verifyToken(token)` — wraps `jwt.verify`.
  - `getJwtSecret()` — fails fast with a clear error if `JWT_SECRET` isn't set, matching
    `placeService.ts`'s existing convention for required env vars (`GOOGLE_PLACES_API_KEY`),
    rather than a bare `!` non-null assertion.
  - Error classes (`EmailAlreadyRegisteredError`, `InvalidCredentialsError`,
    `InvalidEmailError`, `WeakPasswordError`) co-located in this file, matching
    `tripService.ts`'s existing `InvalidTripDateRangeError` convention.
- Installed `bcryptjs`, `jsonwebtoken`, and `@types/jsonwebtoken` now rather than deferring to
  the later "dependencies" step — matches the precedent from `claudeService.ts`, where
  `@anthropic-ai/sdk` was installed in the same step as the file that needed it. `bcryptjs`
  ships its own type declarations, so no separate `@types/bcryptjs` was needed.

## Why these decisions

- Session length is a fixed `24h` code constant (`JWT_EXPIRES_IN`), not an env var — this was a
  fixed product decision (not something that varies per deployment), so a tunable env var would
  be unnecessary indirection.
- Email-format/password-length validation rules live in the service, not the controller —
  mirrors `tripService.ts`'s pattern where the date-range business rule (`≤14 days`, `end >=
  start`) lives in `getDateRange`, while the controller only does shallow "is this a string"
  presence checks. `authController.ts` (Step 5) will follow the same split.

## Verification

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: add authService.ts with register/login/verifyToken`
