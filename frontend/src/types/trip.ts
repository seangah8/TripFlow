import type { Place } from './place';

// Mirrors the backend's TripPreferences exactly — sent as-is in the generate request body.
export interface TripPreferences {
  vibe: 'relaxed' | 'moderate' | 'packed';
  interests: Array<'museums' | 'food' | 'nature' | 'nightlife' | 'shopping'>;
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  budget: 'budget' | 'mid-range' | 'luxury';
}

// Mirrors the backend's TripStopResponse.
export interface TripStop {
  tripStopId: string;
  order: number;
  place: Place;
  estimatedMinutes: number | null;
  reasoning: string | null;
}

export interface TripDay {
  date: string;
  stops: TripStop[];
}

// Mirrors the backend's TripGenerateResponse — the full POST /api/trips/generate response.
export interface Trip {
  tripId: string;
  city: string;
  startDate: string;
  endDate: string;
  days: TripDay[];
}

// Lightweight card shape: no full stops/places, but does include the first
// stop's photo (looked up separately, not a full trip_stops join).
export interface TripSummary {
  tripId: string;
  city: string;
  startDate: string;
  endDate: string;
  photoName: string | null;
}
