# Session 7 (v7) — Step 9: Shared frontend API client

## What was built

- `frontend/src/lib/api.ts` (new) — `apiFetch<T>(path, options?)`, centralizing the
  `new URL(path, VITE_API_URL)` + `fetch()` pattern that was previously duplicated in
  `useGenerateTrip.ts`/`useTrip.ts`, plus the existing `{ error }`-unwrapping-on-failure logic.
  Critically adds `credentials: 'include'` on every call.
- `frontend/src/hooks/useGenerateTrip.ts` / `useTrip.ts` — refactored to call `apiFetch` instead
  of building their own `fetch()` calls.

## Why these decisions

- `credentials: 'include'` is the whole reason this step exists now rather than earlier — every
  trip endpoint is cookie-gated as of Step 7, so without it the browser simply won't send the
  session cookie and every request from these two hooks would silently 401. This also
  automatically covers the wizard's "Generate my trip" flow (`ConfirmStep.tsx` →
  `useGenerateTrip`), with zero changes needed to the wizard itself.
- Centralizing now (rather than earlier, in v1/v2) makes sense because auth is the first
  feature that needs the exact same behavior change applied to literally every request — a
  natural forcing function to finally de-duplicate fetch boilerplate that's existed since v1.

## Verification

`npm run typecheck --prefix frontend` is clean.

## Suggested commit title

`feat: add shared apiFetch client with credentials:'include'`
