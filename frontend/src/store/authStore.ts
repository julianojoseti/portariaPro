import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '../types';
import { authApi } from '../services/apiMethods';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  condominiums: { id: string; name: string }[];
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<AuthResponse>;
  selectCondominium: (condominiumId: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      condominiums: [],
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            condominiums: data.condominiums,
            isAuthenticated: true,
          });
          return data;
        } finally {
          set({ isLoading: false });
        }
      },

      selectCondominium: async (condominiumId) => {
        const data = await authApi.selectCondominium(condominiumId);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set((state) => ({
          user: state.user
            ? { ...state.user, activeCondominiumId: condominiumId }
            : null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }));
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await authApi.logout(refreshToken);
        } catch {
          // ignore
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            condominiums: [],
            isAuthenticated: false,
          });
        }
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      hydrate: () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        if (accessToken) {
          set({ accessToken, refreshToken, isAuthenticated: !!accessToken });
        }
      },
    }),
    {
      name: 'portaria-pro-auth',
      partialize: (state) => ({
        user: state.user,
        condominiums: state.condominiums,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
