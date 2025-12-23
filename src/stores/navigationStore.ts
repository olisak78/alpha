import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeTab: 'components',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    { name: 'navigation-storage' }
  )
);