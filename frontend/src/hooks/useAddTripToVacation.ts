import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { addTripToVacation } from '../services/vacationService';
import type { GenerateTripInput } from '../services/tripService';
import type { Trip } from '../types/trip';

export function useAddTripToVacation(vacationId: string): UseMutationResult<Trip, Error, GenerateTripInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateTripInput) => addTripToVacation(vacationId, input),
    onSuccess: () => {
      // The vacation hub needs the new trip card to appear, and the dashboard's
      // vacation card needs its city-list fallback display to include it too.
      queryClient.invalidateQueries({ queryKey: ['vacation', vacationId] });
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}
