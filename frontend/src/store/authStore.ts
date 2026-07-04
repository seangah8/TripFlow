import { create } from 'zustand';
import type { AuthUser } from '../types/auth';

// Cross-tree shared-state need in this project — the nav/
// logout button, ProtectedRoute, and the dashboard all need "who's logged in"
// independently of each other. Deliberately minimal: no loading flags here —
// that transient state lives in useMe()'s own query state (Step 11), not
// duplicated into a second source of truth.
interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
