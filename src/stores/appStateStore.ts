import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import teamData from '@/data/team/my-team.json';
import { STORAGE_KEYS } from '@/constants/developer-portal';

// ============================================================================
// TYPES
// ============================================================================

type TimelineViewMode = "table" | "chart";

interface ProjectLandscapeSelection {
  projectId: string;
  landscapeId: string;
}

interface AppState {
  // User State (Persisted)
  currentDevId: string;
  setCurrentDevId: (id: string) => void;
  
  // Timeline View (Persisted)
  timelineViewMode: TimelineViewMode;
  setTimelineViewMode: (mode: TimelineViewMode) => void;
  
  // Navigation State (Session-only)
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // UI State (Session-only)
  showLandscapeDetails: boolean;
  setShowLandscapeDetails: (show: boolean) => void;
  
  // Selection State (Session-only)
  selectedComponent: string | null;
  setSelectedComponent: (component: string | null) => void;
  selectedLandscape: string | null;
  setSelectedLandscape: (landscape: string | null) => void;
  
  // Project-specific Landscape Selection (Custom localStorage)
  projectLandscapeSelections: Record<string, string>;
  getSelectedLandscapeForProject: (projectId: string) => string | null;
  setSelectedLandscapeForProject: (projectId: string, landscapeId: string | null) => void;
  
  // Notifications (Session-only)
  meHighlightNotifications: boolean;
  setMeHighlightNotifications: (highlight: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load project-landscape selections from localStorage
 */
function loadProjectLandscapeSelections(): Record<string, string> {
  try {
    const saved = localStorage.getItem('selectedLandscapes');
    if (saved) {
      const savedLandscapes: ProjectLandscapeSelection[] = JSON.parse(saved);
      const selections: Record<string, string> = {};
      savedLandscapes.forEach(item => {
        selections[item.projectId] = item.landscapeId;
      });
      return selections;
    }
  } catch (error) {
    console.warn('Failed to load landscape selections from localStorage:', error);
  }
  return {};
}

/**
 * Save project-landscape selections to localStorage
 */
function saveProjectLandscapeSelections(selections: Record<string, string>): void {
  try {
    const landscapesArray: ProjectLandscapeSelection[] = Object.entries(selections).map(
      ([projectId, landscapeId]) => ({ projectId, landscapeId })
    );
    localStorage.setItem('selectedLandscapes', JSON.stringify(landscapesArray));
  } catch (error) {
    console.warn('Failed to save landscape selections to localStorage:', error);
  }
}

/**
 * Get default dev ID from team data
 */
function getDefaultDevId(): string {
  return teamData.members?.[0]?.id || "u1";
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useAppStateStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User State (Persisted)
      currentDevId: getDefaultDevId(),
      setCurrentDevId: (id) => set({ currentDevId: id }),
      
      // Timeline View (Persisted)
      timelineViewMode: "table",
      setTimelineViewMode: (mode) => set({ timelineViewMode: mode }),
      
      // Navigation State (Session-only)
      activeTab: "components",
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      // UI State (Session-only)
      showLandscapeDetails: false,
      setShowLandscapeDetails: (show) => set({ showLandscapeDetails: show }),
      
      // Selection State (Session-only)
      selectedComponent: null,
      setSelectedComponent: (component) => set({ selectedComponent: component }),
      selectedLandscape: null,
      setSelectedLandscape: (landscape) => set({ selectedLandscape: landscape }),
      
      // Project-specific Landscape Selection (Custom localStorage)
      projectLandscapeSelections: loadProjectLandscapeSelections(),
      
      getSelectedLandscapeForProject: (projectId) => {
        const selections = get().projectLandscapeSelections;
        return selections[projectId] || null;
      },
      
      setSelectedLandscapeForProject: (projectId, landscapeId) => {
        set((state) => {
          const updated = { ...state.projectLandscapeSelections };
          
          if (landscapeId) {
            updated[projectId] = landscapeId;
          } else {
            delete updated[projectId];
          }
          
          // Save to localStorage
          saveProjectLandscapeSelections(updated);
          
          return { projectLandscapeSelections: updated };
        });
      },
      
      // Notifications (Session-only)
      meHighlightNotifications: false,
      setMeHighlightNotifications: (highlight) => set({ meHighlightNotifications: highlight }),
    }),
    {
      name: 'app-state-storage',
      
      // Only persist specific fields
      partialize: (state) => ({
        currentDevId: state.currentDevId,
        timelineViewMode: state.timelineViewMode,
        // Note: projectLandscapeSelections uses custom localStorage
        // Note: session-only state is NOT persisted
      }),
    }
  )
);

// ============================================================================
// CONVENIENCE HOOKS (Individual Selectors)
// ============================================================================

/**
 * Get only current dev ID
 */
export const useCurrentDevId = (): string => {
  return useAppStateStore((state) => state.currentDevId);
};

/**
 * Get only timeline view mode
 */
export const useTimelineViewMode = (): TimelineViewMode => {
  return useAppStateStore((state) => state.timelineViewMode);
};

/**
 * Get only active tab
 */
export const useActiveTab = (): string => {
  return useAppStateStore((state) => state.activeTab);
};

/**
 * Get only show landscape details
 */
export const useShowLandscapeDetails = (): boolean => {
  return useAppStateStore((state) => state.showLandscapeDetails);
};

/**
 * Get only selected component
 */
export const useSelectedComponent = (): string | null => {
  return useAppStateStore((state) => state.selectedComponent);
};

/**
 * Get only selected landscape
 */
export const useSelectedLandscape = (): string | null => {
  return useAppStateStore((state) => state.selectedLandscape);
};

/**
 * Get only me highlight notifications
 */
export const useMeHighlightNotifications = (): boolean => {
  return useAppStateStore((state) => state.meHighlightNotifications);
};

export const useSelectedLandscapeForProject = (projectId: string): string | null => {
  return useAppStateStore((state) => state.projectLandscapeSelections[projectId] || null);
};

/**
 * Get landscape selection functions (never causes re-renders)
 */
export const useLandscapeSelection = () => {
  return {
    getSelectedLandscapeForProject: useAppStateStore((state) => state.getSelectedLandscapeForProject),
    setSelectedLandscapeForProject: useAppStateStore((state) => state.setSelectedLandscapeForProject),
  };
};

/**
 * Get all navigation actions (never causes re-renders)
 */
export const useNavigationActions = () => {
  return {
    setActiveTab: useAppStateStore((state) => state.setActiveTab),
  };
};

/**
 * Get all selection actions (never causes re-renders)
 */
export const useSelectionActions = () => {
  return {
    setSelectedComponent: useAppStateStore((state) => state.setSelectedComponent),
    setSelectedLandscape: useAppStateStore((state) => state.setSelectedLandscape),
  };
};

/**
 * Get all UI actions (never causes re-renders)
 */
export const useUIActions = () => {
  return {
    setShowLandscapeDetails: useAppStateStore((state) => state.setShowLandscapeDetails),
    setTimelineViewMode: useAppStateStore((state) => state.setTimelineViewMode),
  };
};

/**
 * Get all user actions (never causes re-renders)
 */
export const useUserActions = () => {
  return {
    setCurrentDevId: useAppStateStore((state) => state.setCurrentDevId),
    setMeHighlightNotifications: useAppStateStore((state) => state.setMeHighlightNotifications),
  };
};

// ============================================================================
// COMPLETE STATE HOOK (for migration compatibility)
// ============================================================================

/**
 * Drop-in replacement for useAppState from AppStateContext
 * Use this during migration, then gradually switch to specific hooks
 */
export const useAppState = () => {
  const currentDevId = useAppStateStore((state) => state.currentDevId);
  const timelineViewMode = useAppStateStore((state) => state.timelineViewMode);
  const activeTab = useAppStateStore((state) => state.activeTab);
  const showLandscapeDetails = useAppStateStore((state) => state.showLandscapeDetails);
  const selectedComponent = useAppStateStore((state) => state.selectedComponent);
  const selectedLandscape = useAppStateStore((state) => state.selectedLandscape);
  const meHighlightNotifications = useAppStateStore((state) => state.meHighlightNotifications);
  const setCurrentDevId = useAppStateStore((state) => state.setCurrentDevId);
  const setTimelineViewMode = useAppStateStore((state) => state.setTimelineViewMode);
  const setActiveTab = useAppStateStore((state) => state.setActiveTab);
  const setShowLandscapeDetails = useAppStateStore((state) => state.setShowLandscapeDetails);
  const setSelectedComponent = useAppStateStore((state) => state.setSelectedComponent);
  const setSelectedLandscape = useAppStateStore((state) => state.setSelectedLandscape);
  const getSelectedLandscapeForProject = useAppStateStore((state) => state.getSelectedLandscapeForProject);
  const setSelectedLandscapeForProject = useAppStateStore((state) => state.setSelectedLandscapeForProject);
  const setMeHighlightNotifications = useAppStateStore((state) => state.setMeHighlightNotifications);
  
  return {
    // State
    currentDevId,
    timelineViewMode,
    activeTab,
    showLandscapeDetails,
    selectedComponent,
    selectedLandscape,
    meHighlightNotifications,
    
    // Actions
    setCurrentDevId,
    setTimelineViewMode,
    setActiveTab,
    setShowLandscapeDetails,
    setSelectedComponent,
    setSelectedLandscape,
    getSelectedLandscapeForProject,
    setSelectedLandscapeForProject,
    setMeHighlightNotifications,
  };
};

// ============================================================================
// PORTAL STATE HOOK (for hooks.ts compatibility)
// ============================================================================

/**
 * Drop-in replacement for usePortalState from hooks.ts
 */
export const usePortalState = () => {
  const activeTab = useAppStateStore((state) => state.activeTab);
  const currentDevId = useAppStateStore((state) => state.currentDevId);
  const selectedComponent = useAppStateStore((state) => state.selectedComponent);
  const selectedLandscape = useAppStateStore((state) => state.selectedLandscape);
  const showLandscapeDetails = useAppStateStore((state) => state.showLandscapeDetails);
  const meHighlightNotifications = useAppStateStore((state) => state.meHighlightNotifications);
  const setActiveTab = useAppStateStore((state) => state.setActiveTab);
  const setCurrentDevId = useAppStateStore((state) => state.setCurrentDevId);
  const setSelectedComponent = useAppStateStore((state) => state.setSelectedComponent);
  const setSelectedLandscape = useAppStateStore((state) => state.setSelectedLandscape);
  const getSelectedLandscapeForProject = useAppStateStore((state) => state.getSelectedLandscapeForProject);
  const setSelectedLandscapeForProject = useAppStateStore((state) => state.setSelectedLandscapeForProject);
  const setShowLandscapeDetails = useAppStateStore((state) => state.setShowLandscapeDetails);
  const setMeHighlightNotifications = useAppStateStore((state) => state.setMeHighlightNotifications);
  
  return {
    activeTab,
    setActiveTab,
    currentDevId,
    setCurrentDevId,
    selectedComponent,
    setSelectedComponent,
    selectedLandscape,
    setSelectedLandscape,
    getSelectedLandscapeForProject,
    setSelectedLandscapeForProject,
    showLandscapeDetails,
    setShowLandscapeDetails,
    meHighlightNotifications,
    setMeHighlightNotifications,
  };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state (useful for testing)
 */
export const resetAppStateStore = () => {
  useAppStateStore.setState({
    currentDevId: getDefaultDevId(),
    timelineViewMode: "table",
    activeTab: "components",
    showLandscapeDetails: false,
    selectedComponent: null,
    selectedLandscape: null,
    meHighlightNotifications: false,
    projectLandscapeSelections: {},
  });
};

/**
 * Set specific state for testing
 */
export const setAppState = (state: Partial<Omit<AppState, 
  'setCurrentDevId' | 'setTimelineViewMode' | 'setActiveTab' | 
  'setShowLandscapeDetails' | 'setSelectedComponent' | 'setSelectedLandscape' |
  'getSelectedLandscapeForProject' | 'setSelectedLandscapeForProject' | 'setMeHighlightNotifications'
>>) => {
  useAppStateStore.setState(state);
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { AppState, TimelineViewMode };