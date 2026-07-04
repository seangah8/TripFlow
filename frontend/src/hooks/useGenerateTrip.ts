import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { generateTrip, type GenerateTripInput } from '../services/tripService';
import type { Trip } from '../types/trip';

// useMutation over useQuery — this is a POST that triggers a side effect
// (Google fetch + DB writes) on demand, not a GET that loads on mount.
export function useGenerateTrip(): UseMutationResult<Trip, Error, GenerateTripInput> {
  return useMutation({
    mutationFn: generateTrip,
  });
}
