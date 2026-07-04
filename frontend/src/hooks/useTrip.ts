import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchTrip } from '../services/tripService';
import type { Trip } from '../types/trip';

// useQuery, not useMutation — this is a GET that loads on mount (and whenever `tripId`
// changes), unlike useGenerateTrip's on-demand POST.
export function useTrip(tripId: string | undefined): UseQueryResult<Trip, Error> {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => fetchTrip(tripId!),
    enabled: Boolean(tripId),
  });
}
