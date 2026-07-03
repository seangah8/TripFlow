import type { Place } from './place';

// Mirrors the backend's TripStopResponse (backend/src/types/trip.ts) — estimatedMinutes/
// reasoning are always null until v6 introduces Claude's per-stop time estimates.
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
