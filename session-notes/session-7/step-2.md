# Session 7 (v7) — Step 2: Backend auth types

## What was built

- `backend/src/types/auth.ts` (new) — `RegisterRequest { email, password }`,
  `LoginRequest { email, password }`, `AuthUser { id, email }`,
  `AuthResponse { user: AuthUser }`.

## Why these decisions

- `RegisterRequest` has no `confirmPassword` field — per the confirmed decision, the
  confirm-password check happens client-side only, and only `{ email, password }` is ever sent
  over the wire.
- `AuthUser` deliberately excludes `passwordHash` — it's the exact shape that gets sent to the
  frontend and stored in the Zustand auth store, so structuring it this way at the type level
  makes it impossible to accidentally leak the hash in a response later.
- `AuthResponse` is the shared response body for register/login/me — the JWT itself never
  appears in any JSON body, only in the `Set-Cookie` header (per the httpOnly cookie decision).

## Verification

`npm run typecheck --prefix backend` is clean.

## Suggested commit title

`feat: add backend auth request/response types`
