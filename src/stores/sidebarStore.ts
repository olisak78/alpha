import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Sidebar Store
 * 
 * Manages sidebar expansion state with automatic localStorage persistence.
 * Replaces the SidebarContext with a simpler, more performant solution.
 * 
 * Features:
 * - Automatic persistence to localStorage
 * - No provider wrapper needed
 * - Computed width based on expansion state
 * - Toggle convenience method
 * 
 * Migration from Context:
 * - Before: SidebarProvider + manual localStorage + useEffect
 * - After: Direct store access with automatic persistence
 */

interface SidebarState {
  // State
  isExpanded: boolean;
  
  // Actions
  setIsExpanded: (expanded: boolean) => void;
  toggle: () => void;
  
  // Computed values
  getSidebarWidth: () => number;
}

// Sidebar width constants
const SIDEBAR_WIDTH_EXPANDED = 208;
const SIDEBAR_WIDTH_COLLAPSED = 64;

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      // State - default to expanded
      isExpanded: true,
      
      // Actions
      setIsExpanded: (expanded) => set({ isExpanded: expanded }),
      
      toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
      
      // Computed value - returns width based on expansion state
      getSidebarWidth: () => {
        const isExpanded = get().isExpanded;
        return isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
      },
    }),
    {
      name: 'sidebar-storage', // localStorage key
      // Persist only the isExpanded state, not the methods
      partialize: (state) => ({ isExpanded: state.isExpanded }),
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook to get only the sidebar width (computed value)
 * This is more React-like than calling getSidebarWidth()
 * 
 * Usage:
 * const sidebarWidth = useSidebarWidth();
 */
export const useSidebarWidth = (): number => {
  const isExpanded = useSidebarStore((state) => state.isExpanded);
  return isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;
};

/**
 * Hook to get only the toggle function (never causes re-renders)
 * 
 * Usage:
 * const toggleSidebar = useSidebarToggle();
 */
export const useSidebarToggle = () => {
  return useSidebarStore((state) => state.toggle);
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state (useful for testing)
 * 
 * Usage in tests:
 * beforeEach(() => {
 *   resetSidebarStore();
 * });
 */
export const resetSidebarStore = () => {
  useSidebarStore.setState({ isExpanded: true });
};

/**
 * Set specific state for testing
 * 
 * Usage in tests:
 * setSidebarState({ isExpanded: false });
 */
export const setSidebarState = (state: Partial<Pick<SidebarState, 'isExpanded'>>) => {
  useSidebarStore.setState(state);
};

// ============================================================================
// TYPE EXPORTS (for testing and type safety)
// ============================================================================

export type { SidebarState };
export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };