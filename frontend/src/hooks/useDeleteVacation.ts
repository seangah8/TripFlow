import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { deleteVacation } from '../services/vacationService';

export function useDeleteVacation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vacationId: string) => deleteVacation(vacationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}
