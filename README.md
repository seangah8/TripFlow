# TripFlow

An AI-assisted vacation planner. Give it a city (or several, as one multi-city vacation), your
travel dates, and your preferences — it pulls real places from Google Places, groups them into
days by geography, and has Claude curate, order, and explain the best stops for each day.

Built as a sequence of ten versions (v0–v9), each a complete working slice, backend and frontend
together. This README describes the app as of v9, the final committed version.

---

## How to evaluate this

- Read [`BLUE_PRINT.md`](BLUE_PRINT.md) Section 3 for what each version (v0–v9) added and why —
  it's the real build log, not written after the fact.
- Read [`session-notes/`](session-notes/) for the step-by-step reasoning behind individual
  decisions within each version (one folder per version, one file per step).
- See [Why these architectural decisions](#why-these-architectural-decisions) and
  [Known limitations](#known-limitations--with-more-time) below for the shortest path to
  understanding the trade-offs made.
- To try it live: **[trip-flow-ruby.vercel.app](https://trip-flow-ruby.vercel.app)** — no setup
  needed.
- To run it yourself: [Getting started](#getting-started) below — needs a Postgres instance and
  your own Google Places + Anthropic API keys (see [Environment variables](#environment-variables)).

---

## Features

- **City + date-range + preferences wizard** — interests, group type, budget, and pace ("vibe")
  drive the search itself, not just a filter after the fact.
- **Real places, not hallucinations** — every stop comes from a live Google Places search; Claude
  only selects, orders, and explains from what Google actually returned.
- **Deterministic day clustering** — a K-means-based algorithm groups places into geographically
  sensible days, independent of and before any LLM involvement.
- **Claude-curated itinerary** — Claude filters the candidate pool down to the best fit for the
  trip, then adds a time estimate and a short reasoning string per stop.
- **Multi-city vacations** — a `Vacation` wraps multiple single-city `Trip`s, each still built by
  the exact same v1–v7 pipeline.
- **Accounts + dashboard** — register/login, a vacations dashboard, per-trip stop list with a map
  and detail panel, and a one-click "Open in Google Maps" export.

---

## Getting started

### Prerequisites

- Node.js 20+ (developed against v22)
- PostgreSQL running locally (or reachable at the host/port you configure)
- A [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
  key with the Places API (New) enabled
- An [Anthropic API](https://console.anthropic.com/) key

### Installation

```bash
npm install --prefix frontend && npm install --prefix backend
```

Copy `backend/.env.example` to `backend/.env` and fill in real values (see below).

### Environment variables

Set these in `backend/.env` (see `backend/.env.example` for the template):

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default `3001`) |
| `CORS_ORIGIN` | Origin allowed to call the API — the frontend's dev URL |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL connection details |
| `GOOGLE_PLACES_API_KEY` | Used server-side to fetch real places — never exposed to the frontend |
| `ANTHROPIC_API_KEY` | Used server-side for Claude curation calls |
| `JWT_SECRET` | Signs the auth session cookie |

Copy `frontend/.env.example` to `frontend/.env` and set:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (default `http://localhost:3001`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API key, used client-side to render the map and place photos |
| `VITE_GOOGLE_MAPS_MAP_ID` | A configured Google Maps [Map ID](https://developers.google.com/maps/documentation/get-map-id), needed for Advanced Markers |

### Running locally

```bash
npm run dev --prefix backend     # Express on port 3001
npm run dev --prefix frontend    # Vite on port 5173
```

Open `http://localhost:5173`. On first run, seed the database with one placeholder place:

```bash
npm run seed --prefix backend
```

### Running tests

```bash
npm test --prefix backend
npm test --prefix backend -- --testPathPatterns=clustering   # single file
```

(The frontend currently has no automated test suite — verified via `npm run typecheck --prefix frontend`
plus manual browser checks.)

---

## Usage

1. Register or log in.
2. From the dashboard, start a new vacation and add a city + date range + preferences.
3. TripFlow fetches real places for that city, clusters them into days, and has Claude curate and
   explain the final itinerary.
4. View the generated plan: a map, a day-by-day stop list, and a detail panel per stop. Export any
   day to Google Maps with one click.

Preferences that actually shape the generated trip:

- **Interests** — museums, food, nature, nightlife, shopping (drives which Google Places searches run)
- **Vibe / pace** — relaxed, moderate, packed (currently passed to Claude as context only — see
  [Known limitations](#known-limitations--with-more-time))
- **Group type** and **budget** — passed to Claude as curation context

---

## Tech stack

- **Backend:** Node.js, Express, TypeORM, PostgreSQL
- **Frontend:** Vite, React, TypeScript
- **State:** Zustand (client/UI state) + TanStack Query (server state) — no Redux
- **AI:** Claude (Anthropic API) for curation, ordering, and per-stop reasoning
- **Places data:** Google Places API (New)

---

## Project structure

```
TripFlow/
├── BLUE_PRINT.md           ← full versioned spec — read this for the "why" behind every version
├── FUTURE_SCOPE.md         ← designed-but-deferred work, and fixes flagged before continuing
├── session-notes/          ← one folder per version, one file per completed step
├── backend/                ← Node.js + Express + TypeORM
│   └── src/
│       ├── api/
│       │   ├── routes/ · controllers/ · services/ · middleware/
│       ├── entities/       ← TypeORM entities (Place, Trip, TripStop, Vacation, User)
│       ├── utils/          ← clustering.ts — the deterministic K-means day-split
│       └── tests/          ← Jest, flat (not colocated with src)
└── frontend/                ← Vite + React + TypeScript
    └── src/
        ├── pages/ · components/ · hooks/ · services/ · store/ · lib/ · types/
```

---

## Deployment

Live at **[trip-flow-ruby.vercel.app](https://trip-flow-ruby.vercel.app)**:

- **Frontend** — static Vite build on [Vercel](https://vercel.com), pointed at the backend via
  `VITE_API_URL`. `frontend/vercel.json` rewrites every path to `index.html` so React Router's
  client-side routes (e.g. `/trips/:tripId`) survive a direct load or refresh.
- **Backend + database** — Express web service and a managed Postgres instance, both on
  [Render](https://render.com), in the same region so they talk over Render's private network
  (`DB_SSL=true`, since Render's managed Postgres requires SSL). `NODE_ENV=production` there
  switches the session cookie to `secure` + `sameSite: 'none'`, required for the cookie to cross
  the Vercel↔Render domain gap. `CORS_ORIGIN` on the backend is set to the exact Vercel origin.

---

## Why these architectural decisions

- **Places come from Google Places; Claude only curates.** Claude never invents a venue — it
  selects, orders, and reasons about real places Google already returned. This makes hallucinated
  stops structurally impossible, which mattered more here than giving Claude free rein.
- **Clustering is deterministic code (K-means in `clustering.ts`), not the LLM.** Same input always
  produces the same day-split. Geographic grouping is a well-defined optimization problem — there's
  no reason to pay for an LLM call, introduce non-determinism, or risk a worse answer on something
  code already solves reliably. Principle: deterministic where correctness matters, LLM where
  judgment and language matter.
- **Built in vertical slices, one version per session.** Every version (v0–v9) had to run end-to-end
  in a browser, never a backend-only session with nothing to look at. This kept scope honest and
  made each version independently reviewable and demoable.
- **Zustand + TanStack Query, no Redux.** TanStack Query owns all server data (places, trips,
  generated plans) with caching/loading/errors built in; Zustand only holds genuine cross-component
  UI state (introduced at v7 for the auth store, once `useState` actually stopped being enough).

---

## Known limitations / with more time

See [`FUTURE_SCOPE.md`](FUTURE_SCOPE.md) for the full list with implementation notes. Highlights:

- **City input is free text** — a typo or non-city currently just fails the Google Places search
  downstream instead of being caught at entry. A Google Places Autocomplete-backed picker is the
  planned fix.
- **"Vibe"/pace preference doesn't yet control stop density** — relaxed/moderate/packed are sent to
  Claude as prompt context but don't change the actual per-day stop targets.
- **Trip/vacation cover photos use the first stop by order**, not necessarily the most iconic place
  in the trip — planned to become an explicit Claude judgment call during curation.
- **No opening-hours awareness** — a place closed on its assigned day still shows up there (v10 in
  `FUTURE_SCOPE.md`).
- **No hotel-anchored, opening-hours-aware stop ordering within a day** (v11).
- **Single-owner only** — no multi-user/shared vacations (v12), and plans are view-only, not
  editable/draggable (v13).
