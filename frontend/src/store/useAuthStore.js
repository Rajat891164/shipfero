import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * GLOBAL AUTHENTICATION STORE (Zustand)
 * Manages user session, JWT tokens, and merchant profile data.
 */
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      // Login Action
      login: (userData, authToken) => {
        set({ 
          user: userData, 
          token: authToken, 
          isAuthenticated: true 
        });
        localStorage.setItem('auth_token', authToken);
      },

      // Logout Action
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        localStorage.clear();
      },

      // Update Merchant Profile
      updateProfile: (updatedData) => {
        set((state) => ({ 
          user: { ...state.user, ...updatedData } 
        }));
      }
    }),
    {
      name: 'auth-storage', // persists in localStorage
    }
  )
);

export default useAuthStore;
