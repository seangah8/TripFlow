import { apiFetch } from '../lib/api';
import type { Trip, TripPreferences, TripSummary } from '../types/trip';

// Deliberately React/TanStack-Query-agnostic, mirroring the backend's own service split.
// The matching hooks are thin wrappers around these.
export interface GenerateTripInput {
  city: string;
  startDate: string;
  endDate: string;
  preferences: TripPreferences;
}

export function generateTrip(input: GenerateTripInput): Promise<Trip> {
  return apiFetch<Trip>('/api/trips/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchTrip(tripId: string): Promise<Trip> {
  return apiFetch<Trip>(`/api/trips/${tripId}`);
}

export function fetchTrips(): Promise<TripSummary[]> {
  return apiFetch<TripSummary[]>('/api/trips');
}

export function deleteTrip(tripId: string): Promise<void> {
  return apiFetch<void>(`/api/trips/${tripId}`, { method: 'DELETE' });
}
