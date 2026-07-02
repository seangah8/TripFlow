# Session 1 (v1) — Step 1: Environment & dependencies

## What was built
- `backend/.env.example` — already had `GOOGLE_PLACES_API_KEY` documented under `# --- External APIs ---`; no change needed this step.
- `frontend/.env.example` — added `VITE_GOOGLE_MAPS_API_KEY` under the existing `# --- API ---` section, next to `VITE_API_URL`.
- `frontend/package.json` — added `@vis.gl/react-google-maps` dependency.
- Real values for `GOOGLE_PLACES_API_KEY` (backend `.env`) and `VITE_GOOGLE_MAPS_API_KEY` (frontend `.env`) added manually by the user (gitignored, not in this repo).

## Why these decisions
- `VITE_GOOGLE_MAPS_API_KEY` lives in `frontend/.env.example`, not `backend/.env.example` — Vite only reads env files from the frontend project root, so a backend-side entry would never be visible to the browser bundle. Keeping it in the file that's actually functional avoids a documentation/reality mismatch.
- Maps JavaScript API key was set up as a **separate key** from `GOOGLE_PLACES_API_KEY`, restricted to "Maps JavaScript API" only with an HTTP referrer restriction (`localhost:5173/*`). The Places key is server-side only and never sent to the browser; the Maps key is embedded in frontend JS and publicly visible by design, so limiting its scope caps the blast radius if it leaks.
- `@vis.gl/react-google-maps` chosen over `@react-google-maps/api` (older, slower-moving, built around the legacy Marker API) or a hand-rolled script-tag integration — it's Google's own maintained React wrapper, hooks-based, and targets the current Advanced Markers API.

## Suggested commit title
`chore: add Google Maps env vars and react-google-maps dependency`
