# TripFlow — BLUE_PRINT

> Single source of truth: what we're building, in what order, and why. A versioned workflow: each version (v0–v10) is a complete, working, demoable vertical slice — backend and frontend together — with intelligence layered on top of the previous version, never a backend-only session with nothing visible in the browser. One version per session (Session 1 ships v1, Session 2 ships v2, etc.). Treat decisions here as locked once approved.

---

## 1. App Overview

**What it is:** An AI-assisted vacation planner. The user picks a city (later: dates, preferences, a hotel), generates a day-by-day itinerary built from real Google Places data, geographically clustered, and — from v5 onward — curated and explained by Claude.

**Core principle (unchanged from v0):** Places come from Google Places, never invented. Claude only curates from what Google actually returned.

**Who uses it:** A single trip owner planning for their group. No collaborative editing.

**The versioning philosophy:** every version must run end-to-end in a browser by the time it's done. No version ships backend work with nothing to look at. Complexity is added by swapping one piece at a time — random day-splitting becomes real clustering (v2→v3), a bare fetch becomes preference-driven (v3→v4), a dumb filter becomes an AI curator (v4→v5) — while everything built in a prior version keeps working.

---

## 2. Version Build Plan

| Version | Adds | Still not doing |
|---|---|---|
| **v0** | Skeleton: DB ↔ backend ↔ frontend proven, one seeded place | Everything below |
| **v1** | Pick a city, generate button, real Google Places fetch, markers on a map | Dates, days, clustering, preferences, AI, persistence of a "trip" |
| **v2** | Date range (max 14 days), day timeline UI, trip persisted to DB, places split across days **randomly** | Real geography, preferences, AI |
| **v3** | Real K-means clustering replaces the random day-split | Preferences, AI |
| **v4** | Preferences wizard (interests/vibe/group/budget) drives the Google Places search itself; home page + "Add Trip" modal wizard with real routing (`react-router-dom`, pulled forward from v7); `GET /api/trips/:id` (pulled forward from v7, no auth) | AI curation, Zustand (deferred — v4's wizard state didn't need it), trip list/dashboard |
| **v5** | Claude sits between the (now larger) Google fetch and clustering, filtering to what's actually worth including | Per-stop time estimates, reasoning, opening hours, ordering |
| **v6** | Claude also outputs `estimatedMinutes` + `reasoning` per stop; frontend gets the stop-list column + click-to-detail panel | Auth, opening hours, ordering |
| **v7** | Login/register, trips dashboard (cards + "new trip"), `owner` on trips, "Open in Google Maps" export | Opening hours, ordering |
| **v8** | Opening-hours awareness: drop stops closed on their assigned day; move a Sunday-only place onto a Sunday if the trip has one | Ordering |
| **v9** | Hotel/address input; each day's stops get ordered from that starting point using position + hours | — |
| **v10** *(speculative)* | `Vacation` wraps multiple `Trip`s — one vacation, multiple cities, each city still its own single-city trip exactly as v1–v9 built it | Everything else in `FUTURE_SCOPE.md` |

v10 is a stretch goal, not a committed target — see its section below for why it doesn't need to be committed to be worth designing now. Anything not listed above (editable/draggable plans, multi-user/shared trips, place caching across cities, notifications, mobile) is genuinely out of scope — see `FUTURE_SCOPE.md`.

---

## 3. Version Detail

### v0 — Skeleton *(done, Session 0)*
Unchanged from the original blueprint: backend + frontend scaffolded, TypeORM connected, one seeded `Place` fetched and rendered in the browser.

---

### v1 — Real places on a map

**User-facing outcome:** Type a city, hit "Generate," see ~20 real Google Places rendered as markers on an interactive map. No dates, no days, no AI, no persistence beyond the `places` catalog itself.

**Backend:**
- `placeService.ts`: `fetchAndUpsertPlaces(city)` — one or a few `searchText` calls against Google Places (New) for the city, broad query (no interest filtering yet — that's v4), upserts into `places` (same table/columns as v0: id, googlePlaceId, name, lat, lng, city, rating, photoUrl, openingHours).
- New endpoint: `POST /api/places/generate` — body `{ city: string }` → triggers the fetch/upsert, returns the resulting `Place[]`. (Deliberately not under `/api/trips` yet — there's no trip concept, no dates, nothing to persist as a `Trip` row.)

**Frontend:**
- Single page. City text input + "Generate" button + a map (**Google Maps JavaScript SDK**, confirmed — visually and behaviorally consistent with the Google Places data driving the app; needs the Maps JavaScript API enabled on the same Google Cloud project as the existing Places key).
- `useGeneratePlaces` — a TanStack Query mutation wrapping `POST /api/places/generate` (confirmed: TanStack Query from v1 for clean loading/error/retry state on the API call; no Zustand yet — the form is a single city input, plain `useState` covers it).
- On success: drop a marker per returned place.

---

### v2 — Date range, day timeline, random day-split

**User-facing outcome:** Add a start/end date range (max 14 days) alongside the city input. Generating now produces a full trip: a day timeline below the map, click a day to see that day's places on the map. Places are split across days **randomly** — no geography yet.

**Backend:**
- `Trip` and `TripStop` entities now get real rows written (schema unchanged from the original blueprint — see Section 4 below). A trip is created and persisted **the moment it's generated**, with no `owner` — matches the schema's already-nullable `owner` column, so persistence doesn't wait for auth (v7).
- New endpoint: `POST /api/trips/generate` — body `{ city, startDate, endDate }` → fetches places (more of them now — enough to cover `totalDays × a few per day`), assigns each place to a day via a simple round-robin/random split, saves `Trip` + `TripStop` rows, returns the full day-by-day response (see Section 5).
- Google Places fetch needs to avoid returning the same ~20 places on repeat searches for the same city — needs either pagination (`nextPageToken`) or varying the query text across calls.

**Frontend:**
- Date range pickers.
- Day timeline component (horizontal row of day cards) below the map.
- Clicking a day filters which markers show — the full trip response is fetched once and the frontend filters client-side; no per-day fetch needed.

---

### v3 — Real clustering

**User-facing outcome:** Same UI as v2. The difference is invisible in the screenshots but obvious in the result: each day's stops are now genuinely close together geographically instead of scattered randomly across the city.

**Backend:**
- `utils/clustering.ts` — K-means, same design as before it was discarded this session: N centroids seeded by slicing the longitude range of all fetched places into N equal parts (deterministic, no RNG), up to 10 iterations, merge any cluster under 3 places into its nearest neighbor, cap each day at 15 places (highest-rated first) if a cluster somehow exceeds that. Pure function, no DB dependency, fully unit-testable — this is also where Jest gets (re-)introduced, since this is the first pure algorithmic piece worth testing in isolation.
- `tripService.ts` swaps the random day-split for `clusterPlacesByDay(places, totalDays)`.

**Frontend:** unchanged.

---

### v4 — Preferences drive the search

**User-facing outcome:** A home page with an "Add Trip" button opens a 3-step modal wizard
(Destination & Dates → Preferences → Confirm). The places Google actually returns now reflect
the chosen interests, not a generic "tourist attractions" search. Generating navigates to a real
`/trips/:tripId` URL that reloads correctly on refresh.

**Backend:**
- `preferences` (jsonb) added to `Trip`, matching the original blueprint's shape (`{ vibe, interests[], groupType, budget }`).
- `fetchAndUpsertPlaces` gains an `interests` parameter. Rather than Google's structured
  `includedType` place-type filters, each interest maps to a natural-language `textQuery` phrase
  (e.g. "restaurants, cafes and bakeries in {city}"), reusing the existing searchText pagination
  path. An always-on baseline query ("tourist attractions in {city}") runs alongside whichever
  interests are selected, so picking only e.g. "Nightlife" still surfaces a city's must-see
  landmarks — target place count splits evenly across however many queries are active, run
  concurrently.
- `GET /api/trips/:id` pulled forward from v7 (no auth/ownership check yet, matching v2+'s
  already-ownerless trips) — added specifically so the new `/trips/:tripId` route survives a
  refresh. `GET /api/trips` (the list/dashboard endpoint) stays v7.

**Frontend:**
- Real routing (`react-router-dom`) introduced here instead of v7: `/` (home page, "Add Trip"
  button) and `/trips/:tripId` (the trip view). Pulled forward specifically so a generated trip
  has a real, reloadable URL rather than staying page-state.
- The 3-step wizard opens as a modal from the home page. **Zustand was not introduced** — the
  wizard's step/city/dates/preferences state lives in plain `useState` in the modal's container
  component, prop-drilled one level to its 3 step children (not deep prop-drilling, since they're
  direct children). Zustand is deferred to whenever something genuinely needs cross-tree shared
  state instead — v6 was the speculated first case for this, but turned out not to need it either
  (see v6's Frontend section); still deferred.

---

### v5 — Claude curates

**User-facing outcome:** No new UI. The *quality* of what shows up changes — Claude filters the fetched pool down to what's actually worth including before clustering ever runs, instead of every fetched place surviving to the final trip.

**Backend:**
- `claudeService.ts` — one call per trip generation, sees the *entire* candidate pool + preferences + trip length, returns the subset of `googlePlaceId`s it judges legit/interesting/on-theme. Model: `claude-sonnet-5`, via Anthropic's structured outputs (`output_config.format`) for a guaranteed-valid response shape. A Claude call failure (network error, rate limit, refusal, malformed output) fails the whole trip-generation request rather than falling back to the uncurated pool.
- `tripService.ts`: fetch → **Claude filters** → cluster (this ordering — curate before cluster, not after — is the one piece of design already validated earlier this session and carried forward unchanged). The pre-curation Google fetch pool now scales with trip length (60-place minimum, capped at 100 on the normal path) instead of the old ~20-70 fetch-only target.
- The retry stretch goal was implemented, not deferred: if the curated pool is below `targetPlaceCount`, the loop re-fetches a larger pool (escalating past the normal 100-place cap) and re-curates, up to 3 total attempts. It keeps the largest curated result seen across attempts (not just the last), and a failed retry falls back to the best result already found rather than failing the whole request.
- `/test-ai-pipeline` skill built (`.claude/skills/test-ai-pipeline/SKILL.md` + `backend/src/scripts/testAiPipeline.ts`, run via `npm run test:ai-pipeline --prefix backend`) — `CLAUDE.md` referenced this skill since earlier sessions, but it didn't actually exist until now.

**Frontend:** unchanged.

---

### v6 — Time estimates, reasoning, and the stop detail panel

**User-facing outcome:** Click a stop (from the day's list or its map marker) and a detail panel opens: name, category, estimated time to spend there, and Claude's reasoning for why it's on the trip. Map pins now show the place's photo.

**Backend:**
- Claude's response (Section 5's schema) gains `estimatedMinutes` (15–240, 15-minute steps) and `reasoning` (≤300 chars) per selected stop, in the same v5 call — no new API round trip, just a richer response schema (`selectedPlaces: { googlePlaceId, estimatedMinutes, reasoning }[]`, replacing v5's bare `selectedPlaceIds: string[]`).
- **Anthropic's structured-output `json_schema` rejects `minimum`/`maximum`/`multipleOf`/`maxLength` outright** (a 400 at request time, not a silently-unenforced constraint) — discovered live after initial implementation. All numeric/string bounds are enforced in code (clamp/round/truncate) instead of in the request schema, guided only by the system prompt's instructions to Claude. Worth remembering for any future session that adds more structured-output fields to a Claude call.
- `MAX_OUTPUT_TOKENS` raised 4096 → 8192 (v5's ceiling) since each kept place's response is now much larger.
- `clustering.ts` stays untouched (still pure `Place[]`-in/`Place[]`-out) — `claudeService.ts`'s `curatePlaces` returns `CuratedStop[]` (`Place` + `estimatedMinutes` + `reasoning` bundled together), and `tripService.ts` splits that back into a plain `Place[]` for clustering, re-attaching the per-stop details afterward via a `googlePlaceId`-keyed lookup.
- `places.photos` added to the Google Places field mask — the first photo's resource name is stored as `Place.photoName` (renamed from `photoUrl`, which had been silently unpopulated since v1 due to this exact field-mask gap). The frontend builds the actual image URL from this resource name itself, using the existing public `VITE_GOOGLE_MAPS_API_KEY` — the backend's secret `GOOGLE_PLACES_API_KEY` never appears in any API response, to avoid leaking a server-side key to the browser.

**Frontend:**
- Stop list and stop detail panel share a **single** left-side column that toggles between the two (not two permanently-visible panels) — clicking a stop swaps the list for the detail view, with a "← Back to list" link to return.
- Detail panel opens from either a list-row click or a map-marker click; selecting a stop also pans the map to center on it (no zoom change).
- Map pins are custom **photo pins** — a teardrop shape with the place's photo cropped into the round top (falling back to a generic icon when a place has no photo), built with `AdvancedMarker` (replacing the legacy `Marker` used since v1) and requiring a Google Maps **Map ID** (`VITE_GOOGLE_MAPS_MAP_ID`, a separate Cloud Console setup step, distinct from the API key).
- **Zustand was not introduced**, contrary to v4's speculation that v6 would be the first real case for it — the actual component shape (`StopList`/`PlacesMap`/`StopDetailPanel`/`DayTimeline` all direct children of `TripPage`, one level deep) fit plain lifted `useState` in `TripPage` just as well as `DayTimeline`'s existing pattern. Zustand remains deferred to whenever a genuine non-parent/child sharing need shows up.
- Day selection: the old "click again to deselect / show all days" behavior is gone — day 1 is auto-selected on load, and exactly one day is always selected. Switching days clears the selected stop.

---

### v7 — Accounts, dashboard, Google Maps export

**User-facing outcome:** Register/log in. The homepage becomes a trips dashboard — cards for each saved trip plus a "new trip" button, instead of jumping straight into the generator. Each day also gets an "Open in Google Maps" link.

**Backend:**
- `User` entity + `users` table, `POST /api/auth/register`, `POST /api/auth/login` (JWT), auth middleware.
- `owner` FK on `Trip` — now actually populated (was nullable and unused since v2).
- `GET /api/trips` (list, scoped to the logged-in user) — `GET /api/trips/:id` (reload) was
  pulled forward to v4 already (no auth check yet); this version adds the ownership scoping auth
  now makes possible, plus the list endpoint the dashboard needs.
- Google Maps export URL builder (waypoints link) for a given day.

**Frontend:**
- Login/register forms, trips dashboard, back-navigation.

---

### v8 — Opening-hours awareness

**User-facing outcome:** A place closed on the day it would've landed on no longer shows up there. A place that's *only* open on Sundays gets steered toward a Sunday in the trip instead of a day it's actually closed.

**Backend:**
- Reintroduce hours data into the pipeline: after clustering assigns real calendar dates, check each stop against `places.openingHours` for its assigned date.
- If closed that day: prefer **reassigning** it to a different day in the trip where it's open (per the user's description — a place that's Sunday-only should move toward a Sunday, not just get dropped), falling back to dropping it only if no day in the trip works.

---

### v9 — Hotel-anchored routing

**User-facing outcome:** The wizard asks for a hotel/starting address. Each day's stops are now ordered — starting from that address, in a sequence that makes geographic sense and respects each stop's opening hours.

**Backend:**
- Hotel lat/lng becomes the clustering anchor point (replacing the city-bounding-box centroid init from v3).
- Within each day, order stops using position + hours constraints (starting point known for the first time — this is what made ordering impossible to do honestly any earlier).

---

### v10 — Vacations wrap multiple trips *(speculative — may never be reached)*

**The idea:** every version through v9 assumes one trip = one city. v10 removes that ceiling without touching any of v1–v9's actual logic: a new `Vacation` entity sits *above* `Trip`, and a vacation has one or more trips, each one still a single, ordinary city trip built exactly the way it always was. A trip to just Paris is a vacation with one trip in it; a trip to Paris then Rome then Barcelona is one vacation with three trips. Clustering, Claude curation, opening-hours handling, and hotel-anchored routing all stay scoped to a single trip/city — nothing about them needs to know vacations exist.

**User-facing outcome:** The homepage's primary action becomes "New Vacation" instead of "New Trip." Inside a vacation, "Add a city" runs the exact same per-city wizard (city → dates → preferences → confirm) built back in v1–v9, adding one more trip to the vacation each time. The dashboard shows vacations (which may span several cities) instead of bare trips.

**Backend:**
- New `Vacation` entity (see Section 4) — `Trip` gains a `vacationId` FK.
- `POST /api/vacations` — creates a vacation (optional `name`).
- `POST /api/vacations/:id/trips` — same request body as `POST /api/trips/generate` (city, dates, preferences, hotel address); runs the identical, unmodified trip-generation pipeline, just stamps the resulting `Trip` with the vacation it belongs to.
- `GET /api/vacations` / `GET /api/vacations/:id` — list/load, each vacation nested with its full trips.

**Frontend:**
- Dashboard shows vacation cards (city list or custom name) instead of single-trip cards.
- A vacation's view lets you switch between its trips (each trip's own map/day-timeline/stop-list view is unchanged from v6–v9) and add another city.

**Why this is worth writing down even as a maybe:** it's the one piece of the whole roadmap that would be genuinely awkward to retrofit later if we didn't think about it now — every version from v2 onward writes `Trip` rows directly; if `Vacation` shows up as an afterthought, every one of those call sites needs revisiting. Designing it as a pure wrapper now means v1–v9 never have to change even if v10 is the one version that doesn't happen.

---

## 4. Data Schema

Same core entities as the original blueprint, annotated with the version each field starts mattering:

### `places` *(v0, populated for real from v1)*
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK |
| googlePlaceId | varchar | ✅ | unique — dedup key |
| name | varchar | ✅ | |
| lat | decimal(10,7) | ✅ | |
| lng | decimal(10,7) | ✅ | |
| city | varchar | ✅ | |
| rating | decimal(3,1) | ❌ | nullable |
| photoName | varchar | ❌ | nullable — Google's photo *resource name* (e.g. `places/ABC/photos/XYZ`), not a URL; actually populated from v6 (a v1–v5 field-mask gap left this null despite the column existing) — the frontend builds the real image URL itself using the public Maps key |
| openingHours | jsonb | ❌ | nullable — fetched from v1 onward, unused until v8 |
| category | varchar | ❌ | nullable — Google's `primaryTypeDisplayName`, shown in the stop list from v6 |

### `trips` *(rows start existing at v2)*
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK |
| city | varchar | ✅ | |
| startDate | date | ✅ | introduced v2 |
| endDate | date | ✅ | introduced v2 |
| preferences | jsonb | ❌ | nullable until v4 introduces the wizard |
| createdAt | timestamp | ✅ | |
| owner | FK → users | ❌ | nullable until v7 — trips persist without an owner from v2 onward |
| vacationId | FK → vacations | ❌ | v10 — nullable so v2–v9's direct trip-generation flow keeps working unchanged; every trip created via v10's vacation flow gets one |

### `vacations` *(v10, speculative)*
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK |
| name | varchar | ❌ | nullable — optional user label; dashboard falls back to listing the cities of its trips if empty |
| owner | FK → users | ✅ | required — v10 is well after v7, auth already exists by then |
| createdAt | timestamp | ✅ | |

### `trip_stops` *(rows start existing at v2)*
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK |
| tripId | FK → trips | ✅ | cascade delete |
| placeId | FK → places | ✅ | no cascade |
| date | date | ✅ | random assignment v2, geographic v3+, hours-aware v8 |
| order | int | ✅ | stable rendering position until v9; a real recommended sequence from v9 onward |
| estimatedMinutes | int | ❌ | nullable until v6 |
| reasoning | text | ❌ | nullable until v6 |

### `users` *(v7)`
Unchanged from the original blueprint: id, email, passwordHash, createdAt.

---

## 5. API Contract (grows per version)

### `POST /api/places/generate` *(v1 only — superseded by trips/generate from v2)*
Request: `{ city }` → Response: `Place[]`

### `POST /api/trips/generate` *(v2+)*
Request grows over versions:
- v2: `{ city, startDate, endDate }`
- v4: `+ preferences`
- v9: `+ hotelAddress` (or lat/lng, TBD when we get there)

Response (stabilizes by v6):
```json
{
  "tripId": "uuid",
  "city": "Paris",
  "startDate": "2026-07-15",
  "endDate": "2026-07-20",
  "days": [
    {
      "date": "2026-07-15",
      "stops": [
        {
          "tripStopId": "uuid",
          "order": 1,
          "place": { "id": "uuid", "name": "...", "lat": 0, "lng": 0, "rating": 4.7, "category": "...", "photoName": "places/ABC/photos/XYZ", "openingHours": {} },
          "estimatedMinutes": 120,
          "reasoning": "..."
        }
      ]
    }
  ]
}
```

### `GET /api/trips/:id` *(built at v4, pulled forward from v7 — no auth/ownership check until v7)*

### `GET /api/trips` *(list, built at v7 — data has existed since v2, but scoping to a logged-in user needs auth)*

### `POST /api/auth/register` / `POST /api/auth/login` *(v7)*

### `POST /api/vacations`, `POST /api/vacations/:id/trips`, `GET /api/vacations`, `GET /api/vacations/:id` *(v10, speculative)*
The trip-adding endpoint takes the exact same body as `POST /api/trips/generate` — it's the same pipeline, just stamping the result with a `vacationId`.

---

## 6. Frontend Structure

### State management (confirmed)
- **v1–v3:** plain `useState` for form fields; **TanStack Query** for the generate mutation (loading/error/retry).
- **v4:** the preferences wizard turned out not to need Zustand — its 3 steps are direct children
  of one modal component, so plain `useState` in the modal (prop-drilled one level) was simpler
  and sufficient. TanStack Query continues to own all server data (places, trips).
- **v6 revisited this and still didn't need Zustand** — the stop-list/map/detail-panel/day-timeline
  state (active day, selected stop) turned out to be direct children of one page component, so
  plain lifted `useState` (the same pattern `DayTimeline` already used) covered it. Zustand
  remains deferred until a genuine non-parent/child sharing need shows up.

### Map
**Google Maps JavaScript SDK** (confirmed) — consistent with the Google Places data already driving the app. Requires the Maps JavaScript API enabled on the same Google Cloud project as the Places key; usage-billed beyond Google's free monthly credit. From v6, custom photo pins use `AdvancedMarker`, which additionally requires a Google Maps **Map ID** (`VITE_GOOGLE_MAPS_MAP_ID`) — a separate Cloud Console setup step (Maps Platform → Map Management), distinct from the API key.

### Key components by version
| Component | Introduced |
|---|---|
| City input + Generate button + Map | v1 |
| Date range pickers, Day timeline | v2 |
| Home page + "Add Trip" modal wizard, real routing (`/`, `/trips/:tripId`) | v4 |
| Stop list ⟷ Stop detail panel (single toggling column) + custom photo map pins | v6 |
| Login/register forms, Trips dashboard | v7 |

---

## 7. Architecture decisions (locked)

1. **Places come from Google Places — Claude only curates (from v5).** Claude never invents places, and it curates from the full pool, not a pre-cut geographic slice.
2. **Clustering is deterministic code, not the LLM (from v3).** Same input always produces the same output.
3. **Zustand (introduced once genuinely needed — not v4; the v4 wizard's state was simple enough for plain `useState`) + TanStack Query (from v1). No Redux.**
4. **`trip_stops` is the single source of truth for the generated plan** once it exists (v2+). No raw Claude response stored in the DB.
5. **Build in vertical slices — for real this time.** Every version ends with something running in a browser. No version ships backend-only work.
6. **Opening hours are always in local city time (from v8).** No timezone conversion needed, no timezone fields in the schema.

---

## 8. Open questions to confirm before v1 coding starts

- Exact request/response field names for `POST /api/places/generate` (v1) — proposed above, not yet locked.
- v2's "avoid duplicate places across repeated searches" — pagination token vs. varying query text.
