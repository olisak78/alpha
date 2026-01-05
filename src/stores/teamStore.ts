import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type QuickFilterType = 'bugs' | 'tasks' | 'both';

interface JiraFilterState {
  // Filter State
  assigneeFilter: string;
  statusFilter: string;
  sortBy: string;
  search: string;
  quickFilter: QuickFilterType;
  currentPage: number;
  itemsPerPage: number;
  
  // Filter Actions
  setAssigneeFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setSearch: (value: string) => void;
  setQuickFilter: (value: QuickFilterType) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  // Reset
  resetFilters: () => void;
}

interface DialogState {
  // Member Dialog
  memberDialogOpen: boolean;
  setMemberDialogOpen: (open: boolean) => void;
  
  // Link Dialog
  linkDialogOpen: boolean;
  setLinkDialogOpen: (open: boolean) => void;
}

interface ComponentExpansionState {
  // Component Expansion State
  teamComponentsExpanded: Record<string, boolean>;
  toggleComponentExpansion: (componentId: string) => void;
  resetComponentExpansion: () => void;
}

interface TeamState extends JiraFilterState, DialogState, ComponentExpansionState {
  // Global reset
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialJiraFilters = {
  assigneeFilter: 'all',
  statusFilter: 'all',
  sortBy: 'updated_desc',
  search: '',
  quickFilter: 'both' as QuickFilterType,
  currentPage: 1,
  itemsPerPage: 10,
};

const initialDialogState = {
  memberDialogOpen: false,
  linkDialogOpen: false,
};

const initialComponentExpansion = {
  teamComponentsExpanded: {} as Record<string, boolean>,
};

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      // Jira Filter State
      ...initialJiraFilters,
      
      // Dialog State
      ...initialDialogState,
      
      // Component Expansion State
      ...initialComponentExpansion,
      
      // Jira Filter Actions
      setAssigneeFilter: (value) => set({ assigneeFilter: value, currentPage: 1 }),
      setStatusFilter: (value) => set({ statusFilter: value, currentPage: 1 }),
      setSortBy: (value) => set({ sortBy: value, currentPage: 1 }),
      setSearch: (value) => set({ search: value, currentPage: 1 }),
      setQuickFilter: (value) => set({ quickFilter: value, currentPage: 1 }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setItemsPerPage: (items) => set({ itemsPerPage: items, currentPage: 1 }),
      
      resetFilters: () => set({
        ...initialJiraFilters,
        currentPage: 1,
      }),
      
      // Dialog Actions
      setMemberDialogOpen: (open) => set({ memberDialogOpen: open }),
      setLinkDialogOpen: (open) => set({ linkDialogOpen: open }),
      
      // Component Expansion Actions
      toggleComponentExpansion: (componentId) => set((state) => ({
        teamComponentsExpanded: {
          ...state.teamComponentsExpanded,
          [componentId]: !state.teamComponentsExpanded[componentId],
        },
      })),
      
      resetComponentExpansion: () => set({ teamComponentsExpanded: {} }),
      
      // Global Reset
      reset: () => set({
        ...initialJiraFilters,
        ...initialDialogState,
        ...initialComponentExpansion,
      }),
    }),
    {
      name: 'team-storage',
      // Persist filter preferences, but not search, currentPage, dialogs, or expansion state
      partialize: (state) => ({
        assigneeFilter: state.assigneeFilter,
        statusFilter: state.statusFilter,
        sortBy: state.sortBy,
        quickFilter: state.quickFilter,
        itemsPerPage: state.itemsPerPage,
        // Don't persist: search, currentPage, dialogs, expansion
      }),
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS (Individual Selectors)
// ============================================================================

// Jira Filter Selectors
export const useJiraAssigneeFilter = () => useTeamStore((state) => state.assigneeFilter);
export const useJiraStatusFilter = () => useTeamStore((state) => state.statusFilter);
export const useJiraSortBy = () => useTeamStore((state) => state.sortBy);
export const useJiraSearch = () => useTeamStore((state) => state.search);
export const useJiraQuickFilter = () => useTeamStore((state) => state.quickFilter);
export const useJiraCurrentPage = () => useTeamStore((state) => state.currentPage);
export const useJiraItemsPerPage = () => useTeamStore((state) => state.itemsPerPage);

// Jira Filter Actions (stable functions)
export const useJiraFilterActions = () => {
  return {
    setAssigneeFilter: useTeamStore((state) => state.setAssigneeFilter),
    setStatusFilter: useTeamStore((state) => state.setStatusFilter),
    setSortBy: useTeamStore((state) => state.setSortBy),
    setSearch: useTeamStore((state) => state.setSearch),
    setQuickFilter: useTeamStore((state) => state.setQuickFilter),
    setCurrentPage: useTeamStore((state) => state.setCurrentPage),
    setItemsPerPage: useTeamStore((state) => state.setItemsPerPage),
    resetFilters: useTeamStore((state) => state.resetFilters),
  };
};

// All Jira Filters (for components that need multiple)
export const useJiraFilters = () => {
  return {
    assigneeFilter: useTeamStore((state) => state.assigneeFilter),
    statusFilter: useTeamStore((state) => state.statusFilter),
    sortBy: useTeamStore((state) => state.sortBy),
    search: useTeamStore((state) => state.search),
    quickFilter: useTeamStore((state) => state.quickFilter),
    currentPage: useTeamStore((state) => state.currentPage),
    itemsPerPage: useTeamStore((state) => state.itemsPerPage),
  };
};

// Dialog Selectors
export const useMemberDialogOpen = () => useTeamStore((state) => state.memberDialogOpen);
export const useLinkDialogOpen = () => useTeamStore((state) => state.linkDialogOpen);

export const useDialogActions = () => {
  return {
    setMemberDialogOpen: useTeamStore((state) => state.setMemberDialogOpen),
    setLinkDialogOpen: useTeamStore((state) => state.setLinkDialogOpen),
  };
};

// Component Expansion Selectors
export const useTeamComponentsExpanded = () => useTeamStore((state) => state.teamComponentsExpanded);

export const useComponentExpansionActions = () => {
  return {
    toggleComponentExpansion: useTeamStore((state) => state.toggleComponentExpansion),
    resetComponentExpansion: useTeamStore((state) => state.resetComponentExpansion),
  };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset entire team store (for testing)
 */
export const resetTeamStore = () => {
  useTeamStore.getState().reset();
};

/**
 * Set specific state (for testing)
 */
export const setTeamState = (state: Partial<TeamState>) => {
  useTeamStore.setState(state);
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { TeamState, JiraFilterState, DialogState, ComponentExpansionState };