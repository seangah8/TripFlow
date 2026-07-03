import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { Place } from '../types/place';

async function generatePlaces(city: string): Promise<Place[]> {
  const url = new URL('/api/places/generate', import.meta.env.VITE_API_URL);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city }),
  });

  if (!response.ok) {
    // Backend always responds with { error: string } (placesController.ts) —
    // surface that instead of a generic message so the UI can distinguish
    // "you didn't enter a city" from "Google Places failed".
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'Failed to generate places');
  }
  return response.json();
}

// useMutation over useQuery — this is a POST that triggers a side effect
// (Google fetch + DB upsert) on demand, not a GET that loads on mount.
export function useGeneratePlaces(): UseMutationResult<Place[], Error, string> {
  return useMutation({
    mutationFn: generatePlaces,
  });
}
