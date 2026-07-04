import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchTrips } from '../services/tripService';
import type { TripSummary } from '../types/trip';

export function useTrips(): UseQueryResult<TripSummary[], Error> {
  return useQuery({
    queryKey: ['trips'],
    queryFn: fetchTrips,
  });
}
