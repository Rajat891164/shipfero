import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tokenStore } from '../services/api';

/**
 * GLOBAL AUTHENTICATION STORE (Zustand)
 * Manages user session and JWT tokens. Tokens are also mirrored into
 * localStorage via tokenStore so the axios interceptors can read them
 * outside of React.
 */
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Persist JWT pair + mark authenticated.
      setSession: ({ access, refresh, user }) => {
        tokenStore.set(access, refresh);
        set({ user: user ?? null, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        tokenStore.clear();
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updatedData) =>
        set((state) => ({ user: { ...state.user, ...updatedData } })),
    }),
    {
      name: 'auth-storage',
      // Only persist non-sensitive session flags; tokens live in tokenStore.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
