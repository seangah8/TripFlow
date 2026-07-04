import type { Place } from '../entities/Place';

// Shape of Trip.preferences (jsonb) — mirrors BLUE_PRINT.md Section 3's Preferences JSON shape.
export interface TripPreferences {
  vibe: 'relaxed' | 'moderate' | 'packed';
  interests: Array<'museums' | 'food' | 'nature' | 'nightlife' | 'shopping'>;
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  budget: 'budget' | 'mid-range' | 'luxury';
}

// Body for POST /api/trips/generate — BLUE_PRINT.md Section 5 (v2: city + dates; v4: + preferences).
export interface TripGenerateRequest {
  city: string;
  startDate: string;
  endDate: string;
  preferences: TripPreferences;
}

// estimatedMinutes/reasoning are populated from Claude's curation call (v6). The
// columns stay nullable at the DB level for schema flexibility, but a stop that
// made it through curation always has both set together.
export interface TripStopResponse {
  tripStopId: string;
  order: number;
  place: Place;
  estimatedMinutes: number | null;
  reasoning: string | null;
}

export interface TripDayResponse {
  date: string;
  stops: TripStopResponse[];
}

// Response shape for POST /api/trips/generate — BLUE_PRINT.md Section 5.
export interface TripGenerateResponse {
  tripId: string;
  city: string;
  startDate: string;
  endDate: string;
  days: TripDayResponse[];
}

// Lightweight response shape for GET /api/trips (the dashboard's card list) —
// deliberately excludes stops/places (no trip_stops join required).
export interface TripSummaryResponse {
  tripId: string;
  city: string;
  startDate: string;
  endDate: string;
}
