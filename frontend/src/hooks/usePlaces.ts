import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Place } from '../types/place';

// Plain fetch — this is the part a hand-rolled useFetch would also need.
// useQuery below is what adds caching/loading/error handling around it.
async function fetchPlaces(city: string): Promise<Place[]> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/places?city=${encodeURIComponent(city)}`,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch places');
  }
  return response.json();
}

export function usePlaces(city: string): UseQueryResult<Place[], Error> {
  return useQuery({
    // queryKey is the cache key. TanStack Query stores results per key, so
    // usePlaces('Paris') and usePlaces('Rome') are cached separately — and
    // calling usePlaces('Paris') again anywhere else in the app reuses the
    // same cached result instead of firing a new request.
    queryKey: ['places', city],
    // queryFn just needs to return a promise — useQuery handles calling it,
    // tracking isLoading/error/data, retrying on failure, and refetching
    // when the queryKey changes (e.g. city switches to 'Rome').
    queryFn: () => fetchPlaces(city),
  });
}
