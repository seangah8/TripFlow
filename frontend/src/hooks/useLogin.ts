import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser, type LoginInput } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';

export function useLogin(): UseMutationResult<AuthResponse, Error, LoginInput> {
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/');
    },
  });
}
