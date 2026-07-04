import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { loginUser, type LoginInput } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';

export function useLogin(): UseMutationResult<AuthResponse, Error, LoginInput> {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => setUser(data.user),
  });
}
