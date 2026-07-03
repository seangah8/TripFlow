import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Trip } from '../types/trip';

async function fetchTrip(tripId: string): Promise<Trip> {
  const url = new URL(`/api/trips/${tripId}`, import.meta.env.VITE_API_URL);
  const response = await fetch(url);

  if (!response.ok) {
    // Backend always responds with { error: string } (tripController.ts), including the
    // 404 "Trip not found" case — surface that instead of a generic message.
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Failed to load trip');
  }
  return response.json();
}

// useQuery, not useMutation — this is a GET that loads on mount (and whenever `tripId`
// changes), unlike useGenerateTrip's on-demand POST.
export function useTrip(tripId: string | undefined): UseQueryResult<Trip, Error> {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => fetchTrip(tripId!),
    enabled: Boolean(tripId),
  });
}
