import type { TripGenerateRequest, TripSummaryResponse } from './trip';

// Body for POST /api/vacations — name is optional; the frontend's name-prompt
// lets it be left blank.
export interface VacationCreateRequest {
  name?: string;
}

// Body for POST /api/vacations/:id/trips — identical fields to TripGenerateRequest
// (BLUE_PRINT.md: "same request body as POST /api/trips/generate").
export type VacationAddTripRequest = TripGenerateRequest;

// Reused for POST/GET /api/vacations. `trips` is deliberately TripSummaryResponse
// (city/dates only) — full itinerary is fetched separately via GET /api/trips/:id.
export interface VacationResponse {
  vacationId: string;
  name: string | null;
  createdAt: string;
  trips: TripSummaryResponse[];
}
