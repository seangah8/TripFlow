import { apiFetch } from '../lib/api';
import type { AuthResponse } from '../types/auth';

// Deliberately React/TanStack-Query-agnostic, mirroring the backend's own service split.
// The matching hooks are thin wrappers around these.
export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function registerUser(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginUser(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logoutUser(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/me');
}
