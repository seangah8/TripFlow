import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Trip, TripPreferences } from '../types/trip';

export interface GenerateTripInput {
  city: string;
  startDate: string;
  endDate: string;
  preferences: TripPreferences;
}

function generateTrip(input: GenerateTripInput): Promise<Trip> {
  return apiFetch<Trip>('/api/trips/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// useMutation over useQuery — this is a POST that triggers a side effect
// (Google fetch + DB writes) on demand, not a GET that loads on mount.
export function useGenerateTrip(): UseMutationResult<Trip, Error, GenerateTripInput> {
  return useMutation({
    mutationFn: generateTrip,
  });
}
