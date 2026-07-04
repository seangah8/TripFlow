import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { deleteTrip } from '../services/tripService';

// vacationId is the vacation this trip belongs to — needed to invalidate the
// right vacation-hub query, same pattern as useAddTripToVacation.ts.
export function useDeleteTrip(vacationId: string): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => deleteTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation', vacationId] });
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}
