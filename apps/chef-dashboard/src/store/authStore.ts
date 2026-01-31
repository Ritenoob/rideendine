import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface Chef {
  id: string;
  businessName: string;
  status: string;
  stripeOnboardingComplete: boolean;
}

interface AuthState {
  user: User | null;
  chef: Chef | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, chef: Chef | null, accessToken: string, refreshToken: string) => void;
  setChef: (chef: Chef) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      chef: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, chef, accessToken, refreshToken) =>
        set({
          user,
          chef,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      setChef: (chef) => set({ chef }),

      clearAuth: () =>
        set({
          user: null,
          chef: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'chef-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
