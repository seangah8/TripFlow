import type { TripGenerateRequest, TripSummaryResponse } from './trip';

// Body for POST /api/vacations — name is optional; the frontend's name-prompt
// lets it be left blank.
export interface VacationCreateRequest {
  name?: string;
}

// Body for POST /api/vacations/:id/trips — identical fields to TripGenerateRequest
// (BLUE_PRINT.md: "same request body as POST /api/trips/generate").
export type VacationAddTripRequest = TripGenerateRequest;

// Reused for POST /api/vacations, GET /api/vacations (list), GET /api/vacations/:id.
// `trips` is deliberately TripSummaryResponse (city/dates only, no stops/places) —
// the hub only renders trip cards; full itinerary detail is fetched separately via
// the existing, unchanged GET /api/trips/:id when a card is clicked.
export interface VacationResponse {
  vacationId: string;
  name: string | null;
  createdAt: string;
  trips: TripSummaryResponse[];
}
