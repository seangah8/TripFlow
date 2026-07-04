import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createVacation } from '../services/vacationService';
import type { Vacation } from '../types/vacation';

export function useCreateVacation(): UseMutationResult<Vacation, Error, string | undefined> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name?: string) => createVacation(name),
    onSuccess: () => {
      // So the dashboard's vacation list shows the new vacation without a
      // manual refresh.
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}
