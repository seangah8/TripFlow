# TripFlow — BLUE_PRINT

> Single source of truth for everything: what we're building, how it works, what the data looks like, and what each session produces. Blueprint reasoning is folded in. Treat decisions here as locked unless we explicitly update this file together.

---

## 1. App Overview & v1 Scope

**What it is:** An AI-assisted vacation planner. The user provides a destination city, travel dates, and preferences. The app fetches real places from Google Places, groups them into days by geographic proximity, and uses Claude to select, order, and explain the best stops for each day — producing a complete day-by-day itinerary.

**Core principle:** Places come from Google Places (real, verified data). Claude only curates from that list — it never invents places.

**Who uses it:** A single trip owner planning on behalf of their travel group. No collaborative multi-user editing in v1.

**Preferences the user can set:**
- **Vibe / pace** — relaxed / moderate / packed (affects stops per day)
- **Interests** — museums, food, nature, nightlife, shopping (affects place types fetched)
- **Group type** — solo / couple / family with kids / friends (affects Claude's recommendations)
- **Budget** — budget / mid-range / luxury (affects place selection)

**Plan editing:** View-only in v1. The generated plan cannot be manually reordered or modified. Editing is a future scope item.

**Trip length:** Maximum 14 days. Start date and end date are both required before a plan can be generated — the actual calendar dates determine day-of-week, which determines which places are open each day.

**v1 in / out of scope:**

| In scope | Out of scope |
|----------|-------------|
| Single city per trip | Multi-city itineraries |
| Generate + view plan | Edit / reorder plan manually |
| Save & reload trips (Session 2) | Multi-user / shared trips |
| Map view per day (Session 3) | In-app routing / turn-by-turn |
| Export day to Google Maps (Session 3) | City-level place caching |

## 2. User Flows

> The full UI vision is described here. Refer to Section 9 (Session Build Plan) for which session implements each screen.

---

### Screen 1 — Landing Page
- App name ("TripFlow") + short tagline
- One large "Plan a trip" CTA button
- Clicking it navigates to the trip creation wizard

---

### Screen 2 — Trip Creation Wizard (3 steps)

**Step 1: Destination & Dates**
- City name (text input)
- Start date + end date (date pickers) — both required before advancing
- Max 14 days between start and end

**Step 2: Preferences**
- **Interests** — multi-select chip row: Museums · Food & Drink · Nature · Nightlife · Shopping *(more can be added)*
- **Vibe / pace** — dropdown: Relaxed / Moderate / Packed
- **Group type** — dropdown: Solo / Couple / Family with kids / Friends
- **Budget** — dropdown: Budget / Mid-range / Luxury

**Step 3: Confirm & Generate**
- Summary card showing city, dates, and selected preferences
- "Generate my trip" button
- Clicking it triggers the AI pipeline and shows a loading state

---

### Screen 3 — Loading State
- Shown while the backend fetches places, clusters, and calls Claude
- Simple message: "Building your itinerary for [City]…"

---

### Screen 4 — Trip Plan View *(the main screen)*

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Back          TripFlow — Paris · Jul 15–20            │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│   Stop list      │          Map (city)                  │
│   (current day)  │   [markers for each stop today]      │
│                  │                                      │
│   • Stop 1       │                                      │
│   • Stop 2       │                                      │
│   • Stop 3       │                                      │
│                  │                                      │
├──────────────────┴──────────────────────────────────────┤
│        Day timeline:  [Jul 15] [Jul 16] [Jul 17] ...    │
└─────────────────────────────────────────────────────────┘
```

**Left panel — stop list for the selected day:**
- Ordered list of stops for the active day
- Each stop shows: name, category, opening hours

**Right panel — map:**
- Full map of the city
- Numbered markers for each stop of the active day
- Clicking a marker selects that stop

**Bottom — day timeline / picker:**
- Horizontal scrollable row: one card per day (date + day number)
- Clicking a day updates both the map and the stop list

**Stop detail panel** (opens when a stop is clicked — either from list or map):
- Place name + category
- Opening hours for that day
- Estimated time to spend (provided by Claude)
- Claude's reasoning: why this place was chosen / what to expect
- Address

**Top-left back arrow:** Returns to the trips list (Session 2) or landing page (Session 0–1)

---

### Screen 5 — Trips List *(Session 2)*
- Grid of saved trip cards: city name, dates, cover image (or placeholder)
- "New trip" button
- Clicking a card opens the Trip Plan View for that trip

## 3. Data Schema

> `User` is not created until Session 2 (auth). All other entities exist from Session 0/1.

---

### `places`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK, auto-generated |
| googlePlaceId | varchar | ✅ | unique — dedup key |
| name | varchar | ✅ | |
| lat | decimal(10,7) | ✅ | 7 decimal places = ~1cm precision |
| lng | decimal(10,7) | ✅ | |
| city | varchar | ✅ | plain string, no cities table |
| rating | decimal(3,1) | ❌ | nullable |
| photoUrl | varchar | ❌ | nullable — one photo from Google Places |
| openingHours | jsonb | ❌ | nullable — full Google Places hours object (local city time) |

---

### `trips`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK, auto-generated |
| city | varchar | ✅ | |
| startDate | date | ✅ | required — needed to derive day-of-week for each stop |
| endDate | date | ✅ | required — max 14 days from startDate |
| preferences | jsonb | ✅ | `{ vibe, interests[], groupType, budget }` |
| createdAt | timestamp | ✅ | auto |
| owner | FK → users | ❌ | null until Session 2 adds auth |

---

### `trip_stops`
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK |
| tripId | FK → trips | ✅ | cascade delete |
| placeId | FK → places | ✅ | no cascade — places are a shared catalog |
| date | date | ✅ | actual calendar date of this stop (derived from trip dates) |
| order | int | ✅ | position within the day (1 = first stop of the day) |
| estimatedMinutes | int | ✅ | Claude's estimated time to spend, in minutes |
| reasoning | text | ❌ | nullable — Claude's explanation for this stop |

> `trip_stops` is the **single source of truth** for the generated plan. No raw Claude response is stored in the DB.

---

### `users` *(Session 2)*
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | ✅ | PK |
| email | varchar | ✅ | unique |
| passwordHash | varchar | ✅ | bcrypt |
| createdAt | timestamp | ✅ | auto |

---

### Preferences JSON shape
```json
{
  "vibe": "moderate",
  "interests": ["museums", "food"],
  "groupType": "couple",
  "budget": "mid-range"
}
```

Valid values:
- `vibe`: `"relaxed"` | `"moderate"` | `"packed"`
- `interests`: array of `"museums"` | `"food"` | `"nature"` | `"nightlife"` | `"shopping"`
- `groupType`: `"solo"` | `"couple"` | `"family"` | `"friends"`
- `budget`: `"budget"` | `"mid-range"` | `"luxury"`

## 4. API Contract

> All endpoints prefixed with `/api`. Frontend calls via Vite proxy (no CORS needed in dev).

---

### `GET /api/health`
**Purpose:** Sanity check — confirms backend + DB are up.
**Response:**
```json
{ "ok": true }
```

---

### `POST /api/trips/generate`
**Purpose:** The core endpoint. Takes city, dates, preferences → runs the full pipeline → saves trip + stops to DB → returns the complete plan.

**Request body:**
```json
{
  "city": "Paris",
  "startDate": "2026-07-15",
  "endDate": "2026-07-20",
  "preferences": {
    "vibe": "moderate",
    "interests": ["museums", "food"],
    "groupType": "couple",
    "budget": "mid-range"
  }
}
```

**Response:**
```json
{
  "tripId": "uuid",
  "city": "Paris",
  "startDate": "2026-07-15",
  "endDate": "2026-07-20",
  "days": [
    {
      "date": "2026-07-15",
      "dayLabel": "Day 1 — Wednesday",
      "stops": [
        {
          "tripStopId": "uuid",
          "order": 1,
          "place": {
            "id": "uuid",
            "name": "Louvre Museum",
            "lat": 48.8606,
            "lng": 2.3376,
            "rating": 4.7,
            "photoUrl": "https://...",
            "openingHours": { }
          },
          "estimatedMinutes": 120,
          "reasoning": "A cornerstone of Paris art, ideal for a moderate-paced morning..."
        }
      ]
    }
  ]
}
```

---

### `GET /api/trips/:id`
**Purpose:** Load a saved trip by ID. *(Used from Session 3 onward.)*
**Response:** Same shape as the `POST /api/trips/generate` response above.

---

### `GET /api/trips`
**Purpose:** List all trips (for the trips list screen). *(Session 3)*
**Response:**
```json
[
  { "tripId": "uuid", "city": "Paris", "startDate": "2026-07-15", "endDate": "2026-07-20", "createdAt": "..." }
]
```

---

### `GET /api/places?city=X`
**Purpose:** Return places from DB filtered by city. Used in Session 0 as the toolchain proof endpoint.
**Response:** Array of `Place` rows.

## 5. Google Places Integration

**API used:** Google Places API (New) — `POST https://places.googleapis.com/v1/places:searchText`

**How many places to fetch:** 60 total per search (the API max per request is 20, so we do 3 calls with different place type filters). This gives the clustering algorithm enough candidates across all days.

**Interest → place type mapping:**
| User interest | Google place types fetched |
|--------------|--------------------------|
| Museums | `museum`, `art_gallery`, `tourist_attraction` |
| Food & Drink | `restaurant`, `cafe`, `bar`, `bakery` |
| Nature | `park`, `national_park` |
| Nightlife | `bar`, `night_club` |
| Shopping | `shopping_mall`, `market`, `store` |

If no interests are selected, fetch a mix across all categories.

**Fields we request from the API** (`fieldMask`):
- `places.id` (googlePlaceId)
- `places.displayName` (name)
- `places.location` (lat/lng)
- `places.rating`
- `places.photos` (we take the first photo reference and turn it into a URL)
- `places.regularOpeningHours` (openingHours — already in local city time, no conversion needed)
- `places.primaryTypeDisplayName` (category)

**Storing places:** After fetching, we upsert into the `places` table using `googlePlaceId` as the dedup key. If the place already exists in the DB, we update its fields. This means repeated searches for the same city reuse and refresh existing rows — no duplicates.

**Photo URL construction:**
```
https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=800&key={API_KEY}
```
We store this full URL in `places.photoUrl`.

## 6. AI Pipeline Contract

**Model:** Claude Sonnet 4.6 via Anthropic API (`claude-sonnet-4-6`)

**When Claude is called:** Once per day in the trip. If the trip is 5 days, Claude is called 5 times (one call per day's candidate cluster). Calls can run in parallel.

---

### What Claude receives (per day)

```json
{
  "city": "Paris",
  "date": "2026-07-15",
  "dayOfWeek": "Wednesday",
  "dayNumber": 1,
  "totalDays": 5,
  "preferences": {
    "vibe": "moderate",
    "interests": ["museums", "food"],
    "groupType": "couple",
    "budget": "mid-range"
  },
  "candidates": [
    {
      "googlePlaceId": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
      "name": "Louvre Museum",
      "rating": 4.7,
      "isOpenToday": true,
      "openingHoursToday": "9:00 AM – 6:00 PM",
      "photoUrl": "https://..."
    }
  ]
}
```

**Key rules in the system prompt:**
- You MUST only select places from the `candidates` list. Never invent or suggest places not in the list.
- Do NOT include any place where `isOpenToday` is `false`.
- Select between 3 and 6 stops per day depending on `vibe` (relaxed = 3–4, moderate = 4–5, packed = 5–6).
- Order stops to make geographic and logical sense (e.g. morning landmarks → lunch → afternoon → evening).
- Provide `estimatedMinutes` for each stop (realistic time to spend there).
- Return valid JSON only — no prose outside the JSON.

---

### What Claude must return (per day)

```json
{
  "stops": [
    {
      "googlePlaceId": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
      "order": 1,
      "estimatedMinutes": 120,
      "reasoning": "Start your Wednesday morning at the Louvre — its sheer scale rewards a full morning. As a couple on a moderate pace, 2 hours lets you cover the highlights without museum fatigue."
    },
    {
      "googlePlaceId": "...",
      "order": 2,
      "estimatedMinutes": 60,
      "reasoning": "..."
    }
  ]
}
```

**Response validation:** After receiving Claude's response, the backend verifies:
1. All `googlePlaceId` values exist in the candidates list (reject any that don't)
2. `stops` array has between 1 and 8 entries
3. `estimatedMinutes` is a positive integer
4. If validation fails: log the raw response and return a 500 with a clear error message

## 7. Clustering Algorithm

**Goal:** Group ~60 fetched places into N day-buckets by geographic proximity, so each day's stops are in the same area of the city and walking between them is practical.

**Algorithm: K-means with N clusters (one per day)**

Steps:
1. N = number of trip days (endDate − startDate + 1)
2. Initialize N cluster centroids by evenly spacing them across the lat/lng range of all fetched places (deterministic — no random seed)
3. Run up to 10 iterations of K-means:
   - Assign each place to its nearest centroid (Euclidean distance on lat/lng is accurate enough within a city)
   - Recalculate each centroid as the mean lat/lng of its assigned places
4. Resulting clusters are the day-candidate sets passed to Claude

**Why K-means is deterministic here:** We initialize centroids by splitting the bounding box of all places into N equal slices by longitude, not randomly. Same input always produces the same output.

**Cluster size limits:** If a cluster ends up with fewer than 3 places, merge it with the nearest cluster and reduce N by 1 (prevents Claude getting too-small buckets).

**Max candidates per day passed to Claude:** 15. If a cluster has more than 15, keep the 15 highest-rated places.

**Where this code lives:** `backend/src/utils/clustering.ts`

> **Future upgrade (out of scope v1):** When hotel coordinates are added, replace the city-centroid initialization with the hotel's lat/lng as the anchor point for each day. This naturally clusters nearby stops around where the user is sleeping.

## 8. Opening Hours Strategy

**Source:** Google Places `regularOpeningHours` field. Hours are returned in the **local time of the city** — no timezone conversion is ever needed.

**What we store:** The full `regularOpeningHours` object as JSONB in `places.openingHours`. Google's format includes:
- `periods`: array of `{ open: { day, hour, minute }, close: { day, hour, minute } }` where `day` is 0=Sunday … 6=Saturday (Google's convention)
- `weekdayDescriptions`: array of human-readable strings like `"Monday: 9:00 AM – 6:00 PM"`

**How we check if a place is open on a given trip date:**
1. Take the `TripStop.date` (e.g. `"2026-07-15"`)
2. Compute the JavaScript day-of-week: `new Date("2026-07-15").getUTCDay()` → returns 0=Sunday … 6=Saturday
3. Look up that day in `openingHours.periods`
4. Set `isOpenToday: true/false` in the candidate list sent to Claude

**If `openingHours` is null:** Treat as open (unknown hours). Claude is told "hours not available" for that place.

**What Claude sees:** Only `isOpenToday` (boolean) and `openingHoursToday` (the human-readable string for that day, e.g. `"9:00 AM – 6:00 PM"`). Claude never sees the raw periods array — it only gets the pre-computed values for the specific day it's planning.

## 9. Session Build Plan

---

### Session 0 — Scaffold + Toolchain Proof *(current)*
**User-facing outcome:** A browser at `localhost:5173` shows a plain list with one place name ("Eiffel Tower") fetched from the local DB. Proves the full pipe — DB → API → screen — works.

**What gets built:**
- `backend/`: Express + TypeScript, TypeORM, all entities (`Place`, `Trip`, `TripStop`), `GET /api/health`, `GET /api/places?city=X`, seed script
- `frontend/`: Vite + React + Zustand + TanStack Query, one `usePlaces` hook, plain `<ul>` list in `App.tsx`
- `.claude/skills/log-learning.md` custom skill
- `LEARNINGS.md`

---

### Session 1 — Backend Pipeline (AI Pipeline proven, no frontend)
**User-facing outcome:** None visible in the browser yet. The pipeline is verified by calling `POST /api/trips/generate` directly (curl / Postman) and seeing a real day-by-day plan saved to the DB. This session is about proving the hardest piece is correct before building UI around it.

**What gets built:**
- Google Places fetch service (`backend/src/api/services/placesService.ts`) — fetches, upserts places
- Clustering algorithm (`backend/src/utils/clustering.ts`) — groups places into N day-buckets
- Claude call service (`backend/src/api/services/claudeService.ts`) — builds prompt, calls API, validates response
- Trip generation orchestrator (`backend/src/api/services/tripGenerationService.ts`) — wires all three together
- `POST /api/trips/generate` endpoint + controller
- Trip + TripStop save logic

**Definition of done:** `POST /api/trips/generate` with a real city + dates + preferences returns a valid day-by-day plan in JSON and rows appear in `trips` + `trip_stops` tables.

---

### Session 2 — Frontend Wizard + Plan Display
**User-facing outcome:** User fills in the 3-step wizard (city → preferences → confirm), clicks "Generate my trip", sees a loading state, then a plain unstyled day-by-day list: each day's date and each stop's name + reasoning. Full pipeline visible end-to-end in the browser.

**What gets built:**
- Frontend: 3-step trip creation wizard (`TripWizard`, `Step1Destination`, `Step2Preferences`, `Step3Confirm`)
- Zustand store for wizard state (`useTripStore`)
- `useGenerateTrip` TanStack Query mutation hook
- Loading state screen
- Plain plan list view (`TripPlanView` — no map yet, just a list)

---

### Session 3 — Persistence + Auth
**User-facing outcome:** User can register, log in, generate a trip (which saves to their account), then come back later and reload any previously saved trip from a list of their trips.

**What gets built:**
- `User` entity + `users` table
- `owner` FK added to `Trip`
- `POST /api/auth/register`, `POST /api/auth/login` (JWT)
- Auth middleware
- `GET /api/trips`, `GET /api/trips/:id`
- Frontend: register/login forms, trips list screen, back-navigation from plan view to trips list

---

### Session 4 — Map + Export
**User-facing outcome:** The trip plan view shows the full map layout described in Section 2 — map on the right with stop markers, stop list on the left, day timeline at the bottom. Each day also has an "Open in Google Maps" link that opens all stops in order in Google Maps.

**What gets built:**
- Map component (library TBD — likely Leaflet or Google Maps JS SDK)
- Day timeline / picker component
- Stop detail panel (hours, reasoning, estimated time)
- Google Maps export URL builder (waypoints link)

---

### Session 5 — Polish
**User-facing outcome:** The app feels finished — proper loading spinners, error messages if generation fails, empty states, responsive layout.

**What gets built:**
- Loading states for generation, map, place fetch
- Error boundaries + user-facing error messages
- Edge cases: no places found for city, Claude response fails, date range too long
- UI/UX refinement across all screens

## 10. Frontend Structure

### Routes
| Path | Component | Session |
|------|-----------|---------|
| `/` | `LandingPage` | 0 |
| `/plan` | `TripWizard` | 2 |
| `/trip/preview` | `TripPlanView` (unsaved) | 2 |
| `/trips` | `TripsList` | 3 |
| `/trip/:id` | `TripPlanView` (saved) | 3 |
| `/login` | `AuthPage` | 3 |

---

### State split

**Zustand (`useTripStore`) — client state:**
- Wizard: `city`, `startDate`, `endDate`, `preferences`, `currentStep`
- Plan view: `activeDay` (selected date), `selectedStopId`

**TanStack Query — server state:**
- `useGenerateTrip` — `POST /api/trips/generate` mutation
- `useTrip(id)` — `GET /api/trips/:id` query
- `useTrips()` — `GET /api/trips` query (trips list)
- `usePlaces(city)` — `GET /api/places?city=X` query (Session 0 only)

**`useState` — local component state:**
- Form field values within each wizard step
- Stop detail panel open/closed

---

### Key components
```
frontend/src/
├── pages/
│   ├── LandingPage.tsx
│   ├── TripWizard.tsx          ← orchestrates steps 1-2-3
│   ├── TripPlanView.tsx        ← map + list + timeline layout
│   ├── TripsList.tsx
│   └── AuthPage.tsx
├── components/
│   ├── wizard/
│   │   ├── Step1Destination.tsx
│   │   ├── Step2Preferences.tsx
│   │   └── Step3Confirm.tsx
│   ├── plan/
│   │   ├── StopList.tsx
│   │   ├── StopDetail.tsx
│   │   ├── DayTimeline.tsx
│   │   └── MapView.tsx         ← Session 4
│   └── ui/
│       └── (shared small components)
├── hooks/
│   ├── useTripStore.ts         ← Zustand store
│   ├── useGenerateTrip.ts
│   ├── useTrip.ts
│   └── usePlaces.ts
└── types/
    └── index.ts                ← shared TypeScript types matching API response shapes
```

## 11. Out of Scope for v1

| Feature | Why deferred |
|---------|-------------|
| Hotel-anchored clustering | User provides hotel address or picks it on a map in the wizard; clustering uses the hotel coordinates as the starting point for each day so stops are optimized around where they're sleeping. Affects Section 7 (clustering init point changes from city centroid to hotel lat/lng). |
| Multi-city trips | Adds routing complexity between cities; single-city is already rich enough for v1 |
| Editable / draggable plan | Significant UI complexity; view-only is the right v1 scope |
| Multi-user / shared trips | Requires real-time sync or conflict resolution; single owner keeps it simple |
| In-app routing between stops | v1 delegates navigation to Google Maps export |
| City-level place caching | Repeated searches re-fetch from Google Places; caching + freshness logic is a future optimization |
| Notifications / reminders | Out of scope entirely for this project |
| Mobile app | Web only |

---

## Architecture decisions (consolidated from BLUEPRINT.md)

1. **Places come from Google Places — Claude only curates.** Claude never invents places. It only selects, orders, and reasons about the real places it was given.

2. **Clustering is deterministic code, not the LLM.** K-means in `utils/clustering.ts`. Same input always produces the same clusters. The LLM handles judgment (which places are best), not math (how to group them).

3. **Zustand (client state) + TanStack Query (server state), no Redux.** Zustand: wizard form, active day, selected stop. TanStack Query: API data, loading, errors. Single-component state: `useState`.

4. **`trip_stops` is the single source of truth.** The LLM response maps directly to rows — no raw response copy stored in the DB alongside them.

5. **Build in vertical slices.** Each session touches DB + backend + frontend together and produces something demoable. The AI pipeline is the highest risk — it gets proven first (Session 1).
