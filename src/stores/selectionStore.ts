import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectionState {
  // Instead of Map<string, string>
  componentsByProject: Record<string, string | null>;
  
  setComponentForProject: (projectId: string, componentId: string | null) => void;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      componentsByProject: {},
      setComponentForProject: (projectId, componentId) => set((state) => ({
        componentsByProject: { ...state.componentsByProject, [projectId]: componentId }
      })),
    }),
    {
      name: 'selection-storage',
      // No partialize/merge needed - works automatically! 🎉
    }
  )
);