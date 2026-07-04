import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchVacation } from '../services/vacationService';
import type { Vacation } from '../types/vacation';

// useQuery, not useMutation — this is a GET that loads on mount (and whenever
// `vacationId` changes), same pattern as useTrip.ts.
export function useVacation(vacationId: string | undefined): UseQueryResult<Vacation, Error> {
  return useQuery({
    queryKey: ['vacation', vacationId],
    queryFn: () => fetchVacation(vacationId!),
    enabled: Boolean(vacationId),
  });
}
