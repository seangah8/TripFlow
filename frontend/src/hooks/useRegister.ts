import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { registerUser, type RegisterInput } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types/auth';

export function useRegister(): UseMutationResult<AuthResponse, Error, RegisterInput> {
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/');
    },
  });
}
