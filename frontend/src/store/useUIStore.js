import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      isSidebarOpen: true,
      expandedMenus: {},
      
      setExpandedMenus: (label) => set((state) => ({
        expandedMenus: {
          ...state.expandedMenus,
          [label]: !state.expandedMenus[label]
        }
      })),

      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      
      toggleSidebar: () => set((state) => ({ 
        isSidebarOpen: !state.isSidebarOpen 
      })),
    }),
    {
      name: 'ui-storage',
    }
  )
);

export default useUIStore;
