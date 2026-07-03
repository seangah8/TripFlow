# Session 4 (v4) — Step 7: `react-router-dom` setup

## What was built

- `frontend/package.json` — added `react-router-dom` (v7).
- `frontend/src/main.tsx` — wraps `<App />` in `<BrowserRouter>`, inside the existing
  `<QueryClientProvider>`.
- `frontend/src/App.tsx` — replaced the direct `<TripPage />` render with `<Routes>`: `/` →
  `HomePage`, `/trips/:tripId` → `TripDetailPage`.
- `frontend/src/pages/HomePage.tsx` and `frontend/src/pages/TripDetailPage.tsx` — minimal stubs
  for now, each just a placeholder div; real content lands in Steps 8 and 9.
- `frontend/src/pages/TripPage.tsx` left in place untouched (no longer imported anywhere) —
  formal deletion is Step 13, once its logic has actually migrated into `TripDetailPage.tsx`.

## Why these decisions

- `BrowserRouter` (not `HashRouter`) — real paths (`/trips/:id`) rather than `/#/trips/:id`, which
  is what "a real URL" was supposed to mean when this was decided during planning.
- Stubbed both pages rather than building either fully in this step — keeps this step scoped to
  "routing works end-to-end," verified independently of the page content that comes next.

## Verification

`npm run typecheck --prefix frontend` — clean. Ran a real Vite dev server and curled both routes
directly (not just typecheck): `GET /` and `GET /trips/abc123` both return `200` and serve the
SPA shell correctly — client-side routing renders the right stub per path.

**Suggested commit title:** `feat: add react-router-dom with home and trip-detail routes`

## Post-checkpoint correction (during Step 8)

`TripDetailPage.tsx` was renamed back to `TripPage.tsx` — see Step 8's notes for the full reasoning.
This step's commit (already made at the time) still refers to `TripDetailPage`; the rename landed
in a later commit.
