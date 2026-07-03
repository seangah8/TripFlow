import type { Place } from '../entities/Place';

// Shape of Trip.preferences (jsonb) — mirrors BLUE_PRINT.md Section 3's Preferences JSON shape.
export interface TripPreferences {
  vibe: 'relaxed' | 'moderate' | 'packed';
  interests: Array<'museums' | 'food' | 'nature' | 'nightlife' | 'shopping'>;
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  budget: 'budget' | 'mid-range' | 'luxury';
}

// Body for POST /api/trips/generate — BLUE_PRINT.md Section 5 (v2: city + dates only).
export interface TripGenerateRequest {
  city: string;
  startDate: string;
  endDate: string;
}

// estimatedMinutes/reasoning are always null until v6 fills them in from Claude.
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
