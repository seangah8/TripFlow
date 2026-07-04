# Session 7 (v7) — Step 13: Login/Register pages

## What was built

- `frontend/src/pages/LoginPage.tsx` / `RegisterPage.tsx` — real forms now, replacing the
  Step 12 stubs. Plain `useState` (no form library, matching the wizard's existing pattern).
  `LoginPage` calls `useLogin().mutate(..., { onSuccess: () => navigate('/') })`. `RegisterPage`
  has an email/password/confirm-password form; a client-side mismatch check blocks submission
  before the mutation ever fires, and only `{ email, password }` is sent — `confirmPassword`
  never leaves the browser. Both link to each other.
- `frontend/src/styles/LoginPage.scss` (new) — matches `HomePage.scss`'s existing palette
  (`#2563eb` primary button, `crimson` errors, `#666` muted text).
- `frontend/src/styles/RegisterPage.scss` (new) — a thin `@use './LoginPage.scss'` re-export,
  since both pages share an identical `.auth-page`/`.auth-page__form` layout and only differ in
  which fields they render.

## Why these decisions

- One shared stylesheet instead of duplicating the same rules under two names — the two pages
  are visually identical containers with different form fields inside them.
- The register form's `minLength={8}` on the password input is a client-side nicety mirroring
  the backend's real 8-character minimum (Step 3) — same "duplicated cheap check, backend is the
  real boundary" pattern already used for the trip date range.

## Verification

`npm run typecheck --prefix frontend` clean; also ran a full `npm run build` to confirm the
SCSS (including the new `@use` import) compiles without errors — `dist/` is gitignored, no
stray files left behind.

**Still outstanding (per this project's rule against self-testing UI in a browser):** please
click through both forms once the dashboard exists to reach them — register a new account,
confirm the auto-login lands on `/`, log out, log back in, and try a mismatched confirm-password
to see the inline error.

## Suggested commit title

`feat: build real Login/Register forms`
