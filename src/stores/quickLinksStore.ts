import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type ViewLinksType = 'collapsed' | 'expanded';

interface DeleteDialogState {
  isOpen: boolean;
  linkId: string;
  linkTitle: string;
}

interface EditDialogState {
  isOpen: boolean;
  linkId: string;
}

interface QuickLinksState {
  // Search and Filter State
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
  
  // View State
  viewMode: ViewLinksType;
  setViewMode: (mode: ViewLinksType) => void;
  
  // Delete Dialog State
  deleteDialog: DeleteDialogState;
  openDeleteDialog: (linkId: string, linkTitle: string) => void;
  closeDeleteDialog: () => void;
  
  // Edit Dialog State
  editDialog: EditDialogState;
  openEditDialog: (linkId: string) => void;
  closeEditDialog: () => void;
  
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
  deleteDialog: {
    isOpen: false,
    linkId: '',
    linkTitle: '',
  },
  editDialog: {
    isOpen: false,
    linkId: '',
  },
};

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useQuickLinksStore = create<QuickLinksState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Search Actions
      setSearchTerm: (term) => set({ searchTerm: term }),
      
      // Category Filter Actions
      setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
      
      // View Mode Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Delete Dialog Actions
      openDeleteDialog: (linkId, linkTitle) => set({
        deleteDialog: {
          isOpen: true,
          linkId,
          linkTitle,
        },
      }),
      
      closeDeleteDialog: () => set({
        deleteDialog: {
          isOpen: false,
          linkId: '',
          linkTitle: '',
        },
      }),
      
      // Edit Dialog Actions
      openEditDialog: (linkId) => set({
        editDialog: {
          isOpen: true,
          linkId,
        },
      }),
      
      closeEditDialog: () => set({
        editDialog: {
          isOpen: false,
          linkId: '',
        },
      }),
      
      // Reset Function
      reset: () => set(initialState),
    }),
    {
      name: 'quick-links-storage',
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
export const useSearchTerm = (): string => {
  return useQuickLinksStore((state) => state.searchTerm);
};

/**
 * Get only selected category ID
 */
export const useSelectedCategoryId = (): string => {
  return useQuickLinksStore((state) => state.selectedCategoryId);
};

/**
 * Get only view mode
 */
export const useViewMode = (): ViewLinksType => {
  return useQuickLinksStore((state) => state.viewMode);
};

/**
 * Get only delete dialog state
 */
export const useDeleteDialog = (): DeleteDialogState => {
  return useQuickLinksStore((state) => state.deleteDialog);
};

/**
 * Get only edit dialog state
 */
export const useEditDialog = (): EditDialogState => {
  return useQuickLinksStore((state) => state.editDialog);
};

/**
 * Get search/filter actions (never causes re-renders)
 */
export const useSearchFilterActions = () => {
  return {
    setSearchTerm: useQuickLinksStore((state) => state.setSearchTerm),
    setSelectedCategoryId: useQuickLinksStore((state) => state.setSelectedCategoryId),
    setViewMode: useQuickLinksStore((state) => state.setViewMode),
  };
};

/**
 * Get delete dialog actions (never causes re-renders)
 */
export const useDeleteDialogActions = () => {
  return {
    openDeleteDialog: useQuickLinksStore((state) => state.openDeleteDialog),
    closeDeleteDialog: useQuickLinksStore((state) => state.closeDeleteDialog),
  };
};

/**
 * Get edit dialog actions (never causes re-renders)
 */
export const useEditDialogActions = () => {
  return {
    openEditDialog: useQuickLinksStore((state) => state.openEditDialog),
    closeEditDialog: useQuickLinksStore((state) => state.closeEditDialog),
  };
};

/**
 * Get all quick links state (for migration compatibility)
 * Use individual selectors for better performance
 */
export const useQuickLinksState = () => {
  const searchTerm = useQuickLinksStore((state) => state.searchTerm);
  const selectedCategoryId = useQuickLinksStore((state) => state.selectedCategoryId);
  const viewMode = useQuickLinksStore((state) => state.viewMode);
  const deleteDialog = useQuickLinksStore((state) => state.deleteDialog);
  const editDialog = useQuickLinksStore((state) => state.editDialog);
  const setSearchTerm = useQuickLinksStore((state) => state.setSearchTerm);
  const setSelectedCategoryId = useQuickLinksStore((state) => state.setSelectedCategoryId);
  const setViewMode = useQuickLinksStore((state) => state.setViewMode);
  const openDeleteDialog = useQuickLinksStore((state) => state.openDeleteDialog);
  const closeDeleteDialog = useQuickLinksStore((state) => state.closeDeleteDialog);
  const openEditDialog = useQuickLinksStore((state) => state.openEditDialog);
  const closeEditDialog = useQuickLinksStore((state) => state.closeEditDialog);
  
  return {
    // State
    searchTerm,
    selectedCategoryId,
    viewMode,
    deleteDialog,
    editDialog,
    
    // Actions
    setSearchTerm,
    setSelectedCategoryId,
    setViewMode,
    openDeleteDialog,
    closeDeleteDialog,
    openEditDialog,
    closeEditDialog,
  };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state (useful for testing)
 */
export const resetQuickLinksStore = () => {
  useQuickLinksStore.getState().reset();
};

/**
 * Set specific state for testing
 */
export const setQuickLinksState = (state: Partial<Omit<QuickLinksState, 
  'setSearchTerm' | 'setSelectedCategoryId' | 'setViewMode' | 
  'openDeleteDialog' | 'closeDeleteDialog' | 
  'openEditDialog' | 'closeEditDialog' | 'reset'
>>) => {
  useQuickLinksStore.setState(state);
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { QuickLinksState, DeleteDialogState, EditDialogState };