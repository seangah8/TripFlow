import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchVacations } from '../services/vacationService';
import type { Vacation } from '../types/vacation';

export function useVacations(): UseQueryResult<Vacation[], Error> {
  return useQuery({
    queryKey: ['vacations'],
    queryFn: fetchVacations,
  });
}
