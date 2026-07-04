import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { logoutUser } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function useLogout(): UseMutationResult<{ ok: boolean }, Error, void> {
  const clearUser = useAuthStore((state) => state.clearUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearUser();
      // Clears any cached trip/me data from this session so a subsequent
      // login (possibly as a different user) never sees stale data.
      queryClient.clear();
    },
  });
}
