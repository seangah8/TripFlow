import type { TripSummary } from './trip';

// Mirrors the backend's VacationResponse (backend/src/types/vacation.ts) — reused for
// POST /api/vacations, GET /api/vacations (list), and GET /api/vacations/:id (detail).
// `trips` is deliberately TripSummary (city/dates only) — the vacation hub only ever
// renders trip cards; a trip's full itinerary is fetched separately via useTrip.
export interface Vacation {
  vacationId: string;
  name: string | null;
  createdAt: string;
  trips: TripSummary[];
}
