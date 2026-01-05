import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type ViewLinksType = 'collapsed' | 'expanded';

interface LinksPageState {
  // Search and Filter State
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
  
  // View State (persisted to localStorage)
  viewMode: ViewLinksType;
  setViewMode: (mode: ViewLinksType) => void;
  
  // Reset Function
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  searchTerm: '',
  selectedCategoryId: 'all',
  viewMode: 'collapsed' as ViewLinksType,
};

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useLinksPageStore = create<LinksPageState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Search Actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      
      // Category Filter Actions
      setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
      
      // View Mode Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Reset Function
      reset: () => set(initialState),
    }),
    {
      name: 'links-page-storage',
      // Only persist viewMode
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS (Individual Selectors)
// ============================================================================

/**
 * Get only search term
 */
export const useLinksSearchTerm = (): string => {
  return useLinksPageStore((state) => state.searchTerm);
};

/**
 * Get only selected category ID
 */
export const useLinksSelectedCategoryId = (): string => {
  return useLinksPageStore((state) => state.selectedCategoryId);
};

/**
 * Get only view mode
 */
export const useLinksViewMode = (): ViewLinksType => {
  return useLinksPageStore((state) => state.viewMode);
};

/**
 * Get search/filter actions (never causes re-renders)
 */
export const useLinksSearchFilterActions = () => {
  return {
    setSearchTerm: useLinksPageStore((state) => state.setSearchTerm),
    setSelectedCategoryId: useLinksPageStore((state) => state.setSelectedCategoryId),
    setViewMode: useLinksPageStore((state) => state.setViewMode),
  };
};

/**
 * Get all links page state (for migration compatibility)
 * Use individual selectors for better performance
 */
export const useLinksPageState = () => {
  const searchTerm = useLinksPageStore((state) => state.searchTerm);
  const selectedCategoryId = useLinksPageStore((state) => state.selectedCategoryId);
  const viewMode = useLinksPageStore((state) => state.viewMode);
  const setSearchTerm = useLinksPageStore((state) => state.setSearchTerm);
  const setSelectedCategoryId = useLinksPageStore((state) => state.setSelectedCategoryId);
  const setViewMode = useLinksPageStore((state) => state.setViewMode);
  
  return {
    // State
    searchTerm,
    selectedCategoryId,
    viewMode,
    
    // Actions
    setSearchTerm,
    setSelectedCategoryId,
    setViewMode,
  };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state (useful for testing)
 */
export const resetLinksPageStore = () => {
  useLinksPageStore.getState().reset();
};

/**
 * Set specific state for testing
 */
export const setLinksPageState = (state: Partial<Omit<LinksPageState, 
  'setSearchTerm' | 'setSelectedCategoryId' | 'setViewMode' | 'reset'
>>) => {
  useLinksPageStore.setState(state);
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { LinksPageState };