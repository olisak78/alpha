import { create } from 'zustand';
import { Project } from '@/types/api';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectsState {
  // Data
  projects: Project[];
  isLoading: boolean;
  error: any;
  sidebarItems: string[];
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: any) => void;
  
  // Computed helpers
  getProjectByName: (name: string) => Project | undefined;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Define default projects that should always be at the top
const DEFAULT_PROJECT_NAMES = ['cis20', 'ca', 'usrv'];

// Static sidebar items (non-project items)
const STATIC_SIDEBAR_ITEMS = [
  'Home',
  'Teams',
  // Projects will be inserted here
  'Links',
  'Self Service',
  'Plugin Marketplace',
  'AI Arena'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sort projects to put default projects at the top
 */
function sortProjects(rawProjects: Project[]): Project[] {
  const defaultProjects: Project[] = [];
  const otherProjects: Project[] = [];

  rawProjects.forEach((project: Project) => {
    if (DEFAULT_PROJECT_NAMES.includes(project.name)) {
      defaultProjects.push(project);
    } else {
      otherProjects.push(project);
    }
  });

  // Sort default projects in the specified order
  defaultProjects.sort((a, b) => {
    const aIndex = DEFAULT_PROJECT_NAMES.indexOf(a.name);
    const bIndex = DEFAULT_PROJECT_NAMES.indexOf(b.name);
    return aIndex - bIndex;
  });

  return [...defaultProjects, ...otherProjects];
}

/**
 * Generate sidebar items from projects
 */
function generateSidebarItems(projects: Project[]): string[] {
  const projectItems = projects.map((p: Project) => p.title || p.name);
  
  return [
    STATIC_SIDEBAR_ITEMS[0], // Home
    STATIC_SIDEBAR_ITEMS[1], // Teams
    ...projectItems,          // Dynamic project items
    ...STATIC_SIDEBAR_ITEMS.slice(2) // Links, Self Service, AI Arena
  ];
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  isLoading: true,
  error: null,
  sidebarItems: STATIC_SIDEBAR_ITEMS,
  
  // Actions
  setProjects: (rawProjects) => {
    const sortedProjects = sortProjects(rawProjects);
    const sidebarItems = generateSidebarItems(sortedProjects);
    
    set({ 
      projects: sortedProjects,
      sidebarItems,
      isLoading: false,
      error: null
    });
  },
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  // Computed helpers
  getProjectByName: (name) => {
    const { projects } = get();
    return projects.find(p => p.name === name);
  },
}));

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Get only the projects array
 * Use this when you only need the projects list
 */
export const useProjects = (): Project[] => {
  return useProjectsStore((state) => state.projects);
};

/**
 * Get only the sidebar items
 * Use this in the Sidebar component
 */
export const useSidebarItems = (): string[] => {
  return useProjectsStore((state) => state.sidebarItems);
};

/**
 * Get loading state only
 * Use this to show loading indicators
 */
export const useProjectsLoading = (): boolean => {
  return useProjectsStore((state) => state.isLoading);
};

/**
 * Get error state only
 * Use this to show error messages
 */
export const useProjectsError = (): any => {
  return useProjectsStore((state) => state.error);
};

/**
 * Get a specific project by name
 * Stable reference - won't cause re-renders when used with useCallback
 */
export const useProjectByName = (name: string): Project | undefined => {
  return useProjectsStore((state) => 
    state.projects.find(p => p.name === name)
  );
};

/**
 * Get all store actions (never causes re-renders)
 * Use this when you only need to update the store, not read from it
 */
export const useProjectsActions = () => {
  return {
    setProjects: useProjectsStore((state) => state.setProjects),
    setIsLoading: useProjectsStore((state) => state.setIsLoading),
    setError: useProjectsStore((state) => state.setError),
  };
};

// ============================================================================
// COMPLETE STATE HOOK (for migration compatibility)
// ============================================================================

/**
 * Drop-in replacement for useProjectsContext
 * Use this during migration, then gradually switch to specific hooks
 */
export const useProjectsState = () => {
  const projects = useProjectsStore((state) => state.projects);
  const isLoading = useProjectsStore((state) => state.isLoading);
  const error = useProjectsStore((state) => state.error);
  const sidebarItems = useProjectsStore((state) => state.sidebarItems);
  const getProjectByName = useProjectsStore((state) => state.getProjectByName);
  
  return { 
    projects, 
    isLoading, 
    error, 
    sidebarItems,
    getProjectByName 
  };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state (useful for testing)
 */
export const resetProjectsStore = () => {
  useProjectsStore.setState({ 
    projects: [],
    isLoading: true,
    error: null,
    sidebarItems: STATIC_SIDEBAR_ITEMS
  });
};

/**
 * Set specific state for testing
 */
export const setProjectsState = (state: Partial<Pick<ProjectsState, 'projects' | 'isLoading' | 'error'>>) => {
  if (state.projects) {
    useProjectsStore.getState().setProjects(state.projects);
  }
  if (state.isLoading !== undefined) {
    useProjectsStore.setState({ isLoading: state.isLoading });
  }
  if (state.error !== undefined) {
    useProjectsStore.setState({ error: state.error });
  }
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ProjectsState };
export { DEFAULT_PROJECT_NAMES, STATIC_SIDEBAR_ITEMS };