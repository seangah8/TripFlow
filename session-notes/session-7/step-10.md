# Session 7 (v7) — Step 10: Auth types + Zustand store

## What was built

- Installed `zustand` now (matching the precedent of installing a dependency alongside the code
  that needs it, rather than deferring — this makes the originally-planned Step 16 a no-op,
  same as Step 8 turned out to be for the backend).
- `frontend/src/types/auth.ts` (new) — `AuthUser { id, email }`, mirroring the backend's type.
- `frontend/src/store/authStore.ts` (new) — a minimal Zustand store:
  `{ user: AuthUser | null, setUser, clearUser }`.

## Why these decisions

- No loading/`isAuthenticated` flags in the store — that transient "checking the session" state
  belongs to `useMe()`'s own query state (Step 11), not duplicated into a second source of truth
  that could drift out of sync with it.
- This is genuinely the first Zustand use in the project — v4 and v6 both considered it and
  found their state fit plain lifted `useState` instead, since "who's logged in" is the first
  piece of state that multiple *unrelated* parts of the tree (nav/logout, route guards, the
  dashboard) all need to read independently, rather than a parent/child relationship that
  prop-drilling could cover.

## Verification

`npm run typecheck --prefix frontend` is clean.

## Suggested commit title

`feat: add Zustand auth store and frontend auth types`
