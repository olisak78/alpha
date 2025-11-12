import React, { createContext, useContext, ReactNode } from 'react';
import { FeatureToggle, Landscape } from '@/types/developer-portal';
import { DEFAULT_LANDSCAPE, projectComponents } from '@/constants/developer-portal';
import { useLandscapesByProject } from '@/hooks/api/useLandscapes';

interface BusinessLogicContextType {
  // Landscape Management
  getCurrentProjectLandscapes: (activeProject: string) => Landscape[];
  getLandscapeGroups: (activeProject: string) => Record<string, Landscape[]>;
  getFilteredLandscapeIds: (activeProject: string, selectedLandscape: string | null) => string[];
  getProductionLandscapeIds: (activeProject: string) => string[];
  getDefaultLandscape: (activeProject: string) => string | null;
  
  // Landscape API state
  isLoadingLandscapes: (activeProject: string) => boolean;
  landscapesError: (activeProject: string) => Error | null;
  
  // Feature Toggle Logic
  toggleFeature: (toggleId: string, landscape: string, setFeatureToggles: (fn: (prev: FeatureToggle[]) => FeatureToggle[]) => void) => void;
  toggleExpanded: (toggleId: string, setExpandedToggles: (fn: (prev: Set<string>) => Set<string>) => void) => void;
  bulkToggle: (toggleId: string, group: string, enable: boolean, landscapeGroups: Record<string, Landscape[]>, setFeatureToggles: (fn: (prev: FeatureToggle[]) => FeatureToggle[]) => void) => void;
  getGroupStatus: (toggle: FeatureToggle, group: string, landscapeGroups: Record<string, Landscape[]>) => { status: string; color: string };
  getFilteredToggles: (activeProject: string, selectedLandscape: string | null, componentFilter: string, toggleFilter: string, featureToggles: FeatureToggle[]) => FeatureToggle[];
}

const BusinessLogicContext = createContext<BusinessLogicContextType | undefined>(undefined);

interface BusinessLogicProviderProps {
  children: ReactNode;
  activeProject: string;
}

export function BusinessLogicProvider({ children }: BusinessLogicProviderProps) {
  // Fetch landscapes for all three projects
  const cisLandscapes = useLandscapesByProject('cis20');
  const caLandscapes = useLandscapesByProject('ca');
  const usrvLandscapes = useLandscapesByProject('usrv');

  // Store in a map for easy access
  const landscapesByProject: Record<string, Landscape[]> = {
    'CIS@2.0': cisLandscapes.data || [],
    'Cloud Automation': caLandscapes.data || [],
    'Unified Services': usrvLandscapes.data || [],
  };

  const landscapesLoadingByProject: Record<string, boolean> = {
    'CIS@2.0': cisLandscapes.isLoading,
    'Cloud Automation': caLandscapes.isLoading,
    'Unified Services': usrvLandscapes.isLoading,
  };

  const landscapesErrorByProject: Record<string, Error | null> = {
    'CIS@2.0': cisLandscapes.error,
    'Cloud Automation': caLandscapes.error,
    'Unified Services': usrvLandscapes.error,
  };

  // Landscape Management
  const getCurrentProjectLandscapes = (activeProject: string): Landscape[] => {
    return landscapesByProject[activeProject] || [];
  };

  const isLoadingLandscapes = (activeProject: string): boolean => {
    return landscapesLoadingByProject[activeProject] || false;
  };

  const landscapesError = (activeProject: string): Error | null => {
    return landscapesErrorByProject[activeProject] || null;
  };

  const getLandscapeGroups = (activeProject: string): Record<string, Landscape[]> => {
    const currentLandscapes = getCurrentProjectLandscapes(activeProject);

    // Group by environment field from API response
    const groupedByEnvironment: Record<string, Landscape[]> = {};
    
    currentLandscapes.forEach(landscape => {
      const environment = (landscape as any).environment || 'Unknown';
      
      // Capitalize first letter for display
      const groupName = environment.charAt(0).toUpperCase() + environment.slice(1);
      
      if (!groupedByEnvironment[groupName]) {
        groupedByEnvironment[groupName] = [];
      }
      groupedByEnvironment[groupName].push(landscape);
    });
    
    return groupedByEnvironment;
  };

  const getFilteredLandscapeIds = (activeProject: string, selectedLandscape: string | null): string[] => {
    const currentLandscapes = getCurrentProjectLandscapes(activeProject);
    if (!selectedLandscape) return currentLandscapes.map(l => l.id);
    return [selectedLandscape];
  };

  const getProductionLandscapeIds = (activeProject: string): string[] => {
    const currentLandscapes = getCurrentProjectLandscapes(activeProject);
    const devLandscapes = ['dev', 'staging', 'int', 'canary', 'hotfix', 'perf', 'multi-i501817'];
    const devPatterns = ['-staging', '-integrate', '-canary', '-hotfix', 'staging', 'integrate'];
    
    return currentLandscapes
      .filter(l => {
        // Exclude if ID is in dev list
        if (devLandscapes.includes(l.id)) return false;
        // Exclude if ID matches any dev pattern
        return !devPatterns.some(pattern => l.id.includes(pattern));
      })
      .map(l => l.id);
  };

  const getDefaultLandscape = (activeProject: string): string | null => {
  const currentLandscapes = getCurrentProjectLandscapes(activeProject);
  
  if (!currentLandscapes || currentLandscapes.length === 0) {
    return null;
  }

  const defaultLandscape = currentLandscapes.find(
    l => l.name === DEFAULT_LANDSCAPE
  );

  if (defaultLandscape) {
    return defaultLandscape.id;
  }

  // If DEFAULT not found, return first landscape in list
  return currentLandscapes[0].id;
};

  // Feature Toggle Logic
  const toggleFeature = (
    toggleId: string,
    landscape: string,
    setFeatureToggles: (fn: (prev: FeatureToggle[]) => FeatureToggle[]) => void
  ) => {
    setFeatureToggles(prev => prev.map(toggle => 
      toggle.id === toggleId 
        ? {
            ...toggle,
            landscapes: {
              ...toggle.landscapes,
              [landscape]: !toggle.landscapes[landscape]
            }
          }
        : toggle
    ));
  };

  const toggleExpanded = (
    toggleId: string,
    setExpandedToggles: (fn: (prev: Set<string>) => Set<string>) => void
  ) => {
    setExpandedToggles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toggleId)) {
        newSet.delete(toggleId);
      } else {
        newSet.add(toggleId);
      }
      return newSet;
    });
  };

  const bulkToggle = (
    toggleId: string,
    group: string,
    enable: boolean,
    landscapeGroups: Record<string, Landscape[]>,
    setFeatureToggles: (fn: (prev: FeatureToggle[]) => FeatureToggle[]) => void
  ) => {
    const groupLandscapes = landscapeGroups[group];
    setFeatureToggles(prev => prev.map(toggle => 
      toggle.id === toggleId 
        ? {
            ...toggle,
            landscapes: {
              ...toggle.landscapes,
              ...Object.fromEntries(groupLandscapes.map(l => [l.id, enable]))
            }
          }
        : toggle
    ));
  };

  const getGroupStatus = (
    toggle: FeatureToggle,
    group: string,
    landscapeGroups: Record<string, Landscape[]>
  ) => {
    const groupLandscapes = landscapeGroups[group];
    const enabledCount = groupLandscapes.filter(l => toggle.landscapes[l.id]).length;
    const totalCount = groupLandscapes.length;
    
    if (enabledCount === 0) return { status: 'none', color: 'bg-muted' };
    if (enabledCount === totalCount) return { status: 'all', color: 'bg-success' };
    return { status: 'partial', color: 'bg-warning' };
  };

  const getFilteredToggles = (
    activeProject: string,
    selectedLandscape: string | null,
    componentFilter: string,
    toggleFilter: string,
    featureToggles: FeatureToggle[]
  ): FeatureToggle[] => {
    const landscapeIds = getFilteredLandscapeIds(activeProject, selectedLandscape);
    const currentProjectComponents = projectComponents[activeProject as keyof typeof projectComponents] || [];
    const componentIds = currentProjectComponents.map(c => c.id);
    
    return featureToggles.filter(toggle => {
      // Filter by project - only show toggles for components in current project
      if (!componentIds.includes(toggle.component)) {
        return false;
      }
      
      // Filter by component if specific component is selected
      if (componentFilter !== "all" && toggle.component !== componentFilter) {
        return false;
      }
      
      if (toggleFilter === "all-enabled") {
        return landscapeIds.every(id => toggle.landscapes[id] === true);
      }
      if (toggleFilter === "all-disabled") {
        return landscapeIds.every(id => toggle.landscapes[id] === false);
      }
      if (toggleFilter === "mixed") {
        // For mixed state filter, only consider production landscapes (exclude dev environments)
        const productionIds = getProductionLandscapeIds(activeProject);
        if (productionIds.length === 0) return false; // No production landscapes available
        const enabledCount = productionIds.filter(id => toggle.landscapes[id] === true).length;
        return enabledCount > 0 && enabledCount < productionIds.length;
      }
      return true; // "all" filter
    });
  };

  const value: BusinessLogicContextType = {
    getCurrentProjectLandscapes,
    getLandscapeGroups,
    getFilteredLandscapeIds,
    getProductionLandscapeIds,
    getDefaultLandscape,
    isLoadingLandscapes,
    landscapesError,
    toggleFeature,
    toggleExpanded,
    bulkToggle,
    getGroupStatus,
    getFilteredToggles,
  };

  return (
    <BusinessLogicContext.Provider value={value}>
      {children}
    </BusinessLogicContext.Provider>
  );
}

export function useBusinessLogic() {
  const context = useContext(BusinessLogicContext);
  if (context === undefined) {
    throw new Error('useBusinessLogic must be used within a BusinessLogicProvider');
  }
  return context;
}