import type { TripSummary } from './trip';

// Mirrors the backend's VacationResponse. `trips` is deliberately TripSummary
// (city/dates only) — full itineraries are fetched separately via useTrip.
export interface Vacation {
  vacationId: string;
  name: string | null;
  createdAt: string;
  trips: TripSummary[];
}
