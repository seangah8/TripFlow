import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Place } from '../types/place';

// Plain fetch — this is the part a hand-rolled useFetch would also need.
// useQuery below is what adds caching/loading/error handling around it.
async function fetchPlaces(city: string): Promise<Place[]> {
  // URL/URLSearchParams over string concatenation — composes safely as more
  // query params (dates, preferences) get added in later sessions.
  const url = new URL('/api/places', import.meta.env.VITE_API_URL);
  url.searchParams.set('city', city);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch places');
  }
  return response.json();
}

    // queryKey is the cache key. TanStack Query stores results per key, so
    // usePlaces('Paris') and usePlaces('Rome') are cached separately — and
    // calling usePlaces('Paris') again anywhere else in the app reuses the
    // same cached result instead of firing a new request.

    // queryFn just needs to return a promise — useQuery handles calling it,
    // tracking isLoading/error/data, retrying on failure, and refetching
    // when the queryKey changes (e.g. city switches to 'Rome').
export function usePlaces(city: string): UseQueryResult<Place[], Error> {
  return useQuery({
    queryKey: ['places', city],
    queryFn: () => fetchPlaces(city),
  });
}
