import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getMe } from '../services/authService';
import type { AuthResponse } from '../types/auth';

// retry: false — a 401 here means "not logged in", an expected outcome,
// not a transient failure worth retrying.
export function useMe(): UseQueryResult<AuthResponse, Error> {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });
}
