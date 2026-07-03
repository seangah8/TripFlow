import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { Trip } from '../types/trip';

export interface GenerateTripInput {
  city: string;
  startDate: string;
  endDate: string;
}

async function generateTrip(input: GenerateTripInput): Promise<Trip> {
  const url = new URL('/api/trips/generate', import.meta.env.VITE_API_URL);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    // Backend always responds with { error: string } (tripController.ts) —
    // surface that instead of a generic message so the UI can distinguish
    // "invalid date range" from "Google Places failed".
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Failed to generate trip');
  }
  return response.json();
}

// useMutation over useQuery — this is a POST that triggers a side effect
// (Google fetch + DB writes) on demand, not a GET that loads on mount.
export function useGenerateTrip(): UseMutationResult<Trip, Error, GenerateTripInput> {
  return useMutation({
    mutationFn: generateTrip,
  });
}
