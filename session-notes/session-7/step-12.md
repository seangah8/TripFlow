# Session 7 (v7) — Step 12: Auth-gated routing + app bootstrap

## What was built

- `frontend/src/pages/LoginPage.tsx` / `RegisterPage.tsx` (new, stubs) — minimal placeholders
  so `App.tsx`'s new routes compile now; fleshed out into real forms in Step 13 (same
  incremental pattern this project used back in v4 for `HomePage`/`TripDetailPage`).
- `frontend/src/App.tsx` — runs `useMe()` once at the root, syncs the result into `authStore`
  via `useEffect` (`isSuccess` → `setUser`, `isError` → `clearUser`), and doesn't render
  `<Routes>` at all until that initial check resolves. Once resolved, branches on
  `authStore.user`: logged out → only `/register` is reachable, everything else falls back to
  `LoginPage`; logged in → the normal `/` and `/trips/:tripId` routes, everything else redirects
  to `/`.

## A simplification made after your feedback

Originally built as a `ProtectedRoute` wrapper component applied individually to `/` and
`/trips/:tripId` (the standard React Router pattern for mixed public/private routes). You
pointed out that for exactly two protected routes and two public ones, that's more machinery
than the app actually needs — a single top-level `if (!user)` branch in `App.tsx` covers the
same behavior with one file instead of two, and with no per-route wrapping to remember when a
new route is added. Removed `components/ProtectedRoute.tsx` entirely and inlined the check
directly in `App.tsx`.

## Why these decisions

- Blocking `<Routes>` on the initial `useMe()` result (rather than deciding per-route as each
  one renders) is what prevents a flash of the login page on a page refresh — by the time
  either `Routes` block ever renders, `authStore.user` already reflects the real, resolved
  session state.
- `HomePage` is still imported from its current location — the dashboard rename happens in
  Step 14, not here, to keep this step's diff scoped to routing/auth-bootstrap only.

## Verification

`npm run typecheck --prefix frontend` is clean.

## Suggested commit title

`feat: gate routing on session state directly in App.tsx`
