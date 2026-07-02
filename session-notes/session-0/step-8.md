# Session 0 — Step 8: Frontend fetch + display

## What was built
- `frontend/src/types/place.ts` — `Place` interface matching the API response shape.
- `frontend/src/hooks/usePlaces.ts` — `usePlaces(city)`, a TanStack Query hook fetching `${VITE_API_URL}/api/places?city=...` directly (no proxy, per Step 7's CORS switch). Commented to explain `queryKey` (the cache key) and what `useQuery` handles for you vs. the plain `fetchPlaces` function underneath it.
- `frontend/src/vite-env.d.ts` — declares `VITE_API_URL` on `ImportMetaEnv`. Commented to explain why it's needed: Vite only exposes `VITE_`-prefixed vars to browser code, and TypeScript needs to be told this specific one exists.
- `frontend/src/main.tsx` — wraps `<App />` in `QueryClientProvider`. Commented to explain the `QueryClient` is the actual cache store (one instance for the whole app), and the provider makes it reachable from any `useQuery` call (like `usePlaces`) via React context.
- `frontend/src/App.tsx` — calls `usePlaces('Paris')`, renders a `<ul>` of place names with loading/error states.
- Removed leftover Vite scaffold styles (`App.css`, `index.css`) and the dead `import './index.css'` from `main.tsx`, per user request — left the new `styles/main.scss` and `styles/App.scss` placeholders untouched for later sessions.
- Fixed a `verbatimModuleSyntax` typecheck error (set by the Vite template) requiring `import type { ... }` for type-only imports in `usePlaces.ts`.
- **Verified live in the browser** — user confirmed the page renders "Eiffel Tower" in the list. Re-verified after all edits: `npm run typecheck` clean.

## Why these decisions were made
- Kept `usePlaces` built on `useQuery` rather than switching to a hand-rolled `useFetch` — discussed the tradeoff directly with the user (locked decision in `CLAUDE.md` Section 7 / `BLUE_PRINT.md`; component-level code is identical either way; benefits compound from Session 1-2 onward with more server-state hooks). User's explicit call to keep it, with added comments so the mechanics are clear.
- `types/place.ts` (not `types/index.ts`) — same per-domain types convention established on the backend.
- `city='Paris'` hardcoded — no wizard yet to pick a city (Session 2); matches the seeded data from Step 6.
- Comments in `usePlaces.ts`/`vite-env.d.ts`/`main.tsx` explain *why* each piece exists (cache key, env var exposure boundary, provider/context relationship) rather than restating what the code visibly does — per `CLAUDE.md` Section 6's comment style, but written for a first-time TanStack Query reader specifically since that's what was asked.

## Suggested commit title
`feat(frontend): fetch and display places via usePlaces hook, with explanatory comments`
