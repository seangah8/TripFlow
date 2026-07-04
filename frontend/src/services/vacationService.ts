import { apiFetch } from '../lib/api';
import type { Trip } from '../types/trip';
import type { Vacation } from '../types/vacation';
import type { GenerateTripInput } from './tripService';

// Plain functions mirroring tripService.ts's split — deliberately
// React/TanStack-Query-agnostic. The matching hooks wrap these.
export function createVacation(name?: string): Promise<Vacation> {
  return apiFetch<Vacation>('/api/vacations', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function fetchVacations(): Promise<Vacation[]> {
  return apiFetch<Vacation[]>('/api/vacations');
}

export function fetchVacation(vacationId: string): Promise<Vacation> {
  return apiFetch<Vacation>(`/api/vacations/${vacationId}`);
}

export function addTripToVacation(vacationId: string, input: GenerateTripInput): Promise<Trip> {
  return apiFetch<Trip>(`/api/vacations/${vacationId}/trips`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
