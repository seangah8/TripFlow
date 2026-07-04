# Session 7 (v7) — Step 4: `authMiddleware.ts` + `Request` type augmentation

## What was built

- `backend/src/types/express.d.ts` (new) — module augmentation adding `userId: string` to
  Express's `Request` type, so every downstream handler can read `req.userId` typed, with no
  per-handler casting.
- `backend/src/api/middleware/authMiddleware.ts` (new, first file in a new `middleware/`
  folder) — reads `req.cookies?.token`, 401s if missing; calls `verifyToken`, 401s on any
  failure (expired/invalid/malformed), logging the real error server-side first; on success
  sets `req.userId` and calls `next()`.
- Installed `cookie-parser` + `@types/cookie-parser` now (same reasoning as Step 3 — the file
  needs it to typecheck).

## Why these decisions

- Module augmentation (not a custom typed request wrapper) — lets every route handler just read
  `req.userId` directly like any other Express property, rather than re-casting `req` in every
  controller.
- A single generic `{ error: 'Not authenticated' }` / 401 for both "no cookie" and
  "invalid/expired token" — there's no meaningful reason for a client to distinguish those two
  cases, and collapsing them avoids leaking details about *why* a token was rejected.
- The cookie isn't actually readable yet — `cookie-parser` isn't mounted in `server.ts` until
  Step 6, so `req.cookies` is `undefined` at runtime right now even though it typechecks. This
  middleware isn't wired into any route yet either (that's Step 7), so nothing is actually
  exercised until both land.

## Verification

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: add authMiddleware.ts and Request.userId type augmentation`
