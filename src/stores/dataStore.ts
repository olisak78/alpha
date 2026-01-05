import { create } from 'zustand';
import { FeatureToggle, componentVersions } from '@/types/developer-portal';
import { mockFeatureToggles } from '@/data/mockFeatureToggles';
import { projectComponents } from '@/constants/developer-portal';

// ============================================================================
// TYPES
// ============================================================================

type ToggleFilter = "all" | "all-enabled" | "all-disabled" | "mixed";

interface DataState {
  // Feature Toggles State
  featureToggles: FeatureToggle[];
  expandedToggles: Set<string>;
  toggleFilter: ToggleFilter;
  
  // Rate Limiting & Logs State
  logLevels: Record<string, string>;
  
  // Component State
  componentFilter: string;
  expandedComponents: Record<string, boolean>;
  
  // Actions - Feature Toggles
  setFeatureToggles: (toggles: FeatureToggle[] | ((prev: FeatureToggle[]) => FeatureToggle[])) => void;
  setExpandedToggles: (expanded: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setToggleFilter: (filter: ToggleFilter) => void;
  
  // Actions - Logs
  setLogLevels: (levels: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  
  // Actions - Components
  setComponentFilter: (filter: string) => void;
  setExpandedComponents: (expanded: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}

// ============================================================================
// HELPER FUNCTIONS (Pure functions - no state dependency)
// ============================================================================

/**
 * Get component health status
 */
export function getComponentHealth(componentId: string, landscape: string | null): string {
  if (!landscape) return "N/A";
  return "UP";
}

/**
 * Check if component has alerts
 */
export function getComponentAlerts(componentId: string, landscape: string | null): boolean {
  if (!landscape) return false;
  return false;
}

/**
 * Get deployed version of a component in a landscape
 */
export function getDeployedVersion(compId: string | null, landscape: string | null): string | null {
  if (!compId || !landscape) return null;
  const data = (componentVersions as Record<string, any[]>)[compId];
  const match = data?.find((d) => d.landscape === landscape);
  return match?.buildProperties?.version ?? null;
}

/**
 * Get status color class for a given status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "healthy":
    case "active":
    case "deployed":
      return "bg-success text-white";
    case "warning":
    case "deploying":
      return "bg-warning text-white";
    case "error":
    case "inactive":
    case "failed":
      return "bg-destructive text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Get available components for a project based on feature toggles
 */
export function getAvailableComponents(activeProject: string, featureToggles: FeatureToggle[]): string[] {
  const currentProjectComponents = projectComponents[activeProject as keyof typeof projectComponents] || [];
  const toggleComponents = featureToggles
    .filter(toggle => currentProjectComponents.some(c => c.id === toggle.component))
    .map(toggle => toggle.component);
  
  return [...new Set(toggleComponents)].sort();
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useDataStore = create<DataState>((set) => ({
  // Initial State - Feature Toggles
  featureToggles: mockFeatureToggles,
  expandedToggles: new Set<string>(),
  toggleFilter: "all",
  
  // Initial State - Logs
  logLevels: {},
  
  // Initial State - Components
  componentFilter: "all",
  expandedComponents: {},
  
  // Actions - Feature Toggles
  setFeatureToggles: (toggles) => set((state) => ({
    featureToggles: typeof toggles === 'function' ? toggles(state.featureToggles) : toggles
  })),
  
  setExpandedToggles: (expanded) => set((state) => ({
    expandedToggles: typeof expanded === 'function' ? expanded(state.expandedToggles) : expanded
  })),
  
  setToggleFilter: (filter) => set({ toggleFilter: filter }),
  
  // Actions - Logs
  setLogLevels: (levels) => set((state) => ({
    logLevels: typeof levels === 'function' ? levels(state.logLevels) : levels
  })),
  
  // Actions - Components
  setComponentFilter: (filter) => set({ componentFilter: filter }),
  
  setExpandedComponents: (expanded) => set((state) => ({
    expandedComponents: typeof expanded === 'function' ? expanded(state.expandedComponents) : expanded
  })),
}));

// ============================================================================
// CONVENIENCE HOOKS (Individual Selectors)
// ============================================================================

/**
 * Get only feature toggles
 */
export const useFeatureToggles = (): FeatureToggle[] => {
  return useDataStore((state) => state.featureToggles);
};

/**
 * Get only expanded toggles
 */
export const useExpandedToggles = (): Set<string> => {
  return useDataStore((state) => state.expandedToggles);
};

/**
 * Get only toggle filter
 */
export const useToggleFilter = (): ToggleFilter => {
  return useDataStore((state) => state.toggleFilter);
};

/**
 * Get only log levels
 */
export const useLogLevels = (): Record<string, string> => {
  return useDataStore((state) => state.logLevels);
};

/**
 * Get only component filter
 */
export const useComponentFilter = (): string => {
  return useDataStore((state) => state.componentFilter);
};

/**
 * Get only expanded components
 */
export const useExpandedComponents = (): Record<string, boolean> => {
  return useDataStore((state) => state.expandedComponents);
};

/**
 * Get all feature toggle actions (never causes re-renders)
 */
export const useFeatureToggleActions = () => {
  return {
    setFeatureToggles: useDataStore((state) => state.setFeatureToggles),
    setExpandedToggles: useDataStore((state) => state.setExpandedToggles),
    setToggleFilter: useDataStore((state) => state.setToggleFilter),
  };
};

/**
 * Get all component actions (never causes re-renders)
 */
export const useComponentActions = () => {
  return {
    setComponentFilter: useDataStore((state) => state.setComponentFilter),
    setExpandedComponents: useDataStore((state) => state.setExpandedComponents),
  };
};

/**
 * Get all log actions (never causes re-renders)
 */
export const useLogActions = () => {
  return {
    setLogLevels: useDataStore((state) => state.setLogLevels),
  };
};

// ============================================================================
// COMPLETE STATE HOOK (for migration compatibility)
// ============================================================================

/**
 * Drop-in replacement for useData from DataContext
 * Use this during migration, then gradually switch to specific hooks
 */
export const useData = () => {
  const featureToggles = useDataStore((state) => state.featureToggles);
  const expandedToggles = useDataStore((state) => state.expandedToggles);
  const toggleFilter = useDataStore((state) => state.toggleFilter);
  const logLevels = useDataStore((state) => state.logLevels);
  const componentFilter = useDataStore((state) => state.componentFilter);
  const expandedComponents = useDataStore((state) => state.expandedComponents);
  const setFeatureToggles = useDataStore((state) => state.setFeatureToggles);
  const setExpandedToggles = useDataStore((state) => state.setExpandedToggles);
  const setToggleFilter = useDataStore((state) => state.setToggleFilter);
  const setLogLevels = useDataStore((state) => state.setLogLevels);
  const setComponentFilter = useDataStore((state) => state.setComponentFilter);
  const setExpandedComponents = useDataStore((state) => state.setExpandedComponents);
  
  return {
    // State
    featureToggles,
    expandedToggles,
    toggleFilter,
    logLevels,
    componentFilter,
    expandedComponents,
    
    // Actions
    setFeatureToggles,
    setExpandedToggles,
    setToggleFilter,
    setLogLevels,
    setComponentFilter,
    setExpandedComponents,
    
    // Helper functions (re-exported)
    getComponentHealth,
    getComponentAlerts,
    getDeployedVersion,
    getStatusColor,
    getAvailableComponents,
  };
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Reset store to initial state (useful for testing)
 */
export const resetDataStore = () => {
  useDataStore.setState({
    featureToggles: mockFeatureToggles,
    expandedToggles: new Set<string>(),
    toggleFilter: "all",
    logLevels: {},
    componentFilter: "all",
    expandedComponents: {},
  });
};

/**
 * Set specific state for testing
 */
export const setDataState = (state: Partial<Omit<DataState, 
  'setFeatureToggles' | 'setExpandedToggles' | 'setToggleFilter' | 
  'setLogLevels' | 'setComponentFilter' | 'setExpandedComponents'
>>) => {
  useDataStore.setState(state);
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { DataState, ToggleFilter };