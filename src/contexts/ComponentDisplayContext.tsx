import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import type { ComponentHealthCheck, Component } from '@/types/health';
import { type SystemInformation, fetchSystemInformation } from '@/services/healthApi';

interface ComponentDisplayContextType {
  // Project data
  projectId: string;

  // Landscape data
  selectedLandscape: string | null;
  selectedLandscapeData: any;
  isCentralLandscape: boolean;
  noCentralLandscapes: boolean;

  // Team mappings
  teamNamesMap: Record<string, string>;
  teamColorsMap: Record<string, string>;

  // Health data
  componentHealthMap: Record<string, ComponentHealthCheck>;
  isLoadingHealth: boolean;

  // System information
  componentSystemInfoMap: Record<string, SystemInformation>;
  isLoadingSystemInfo: boolean;

  // Display state
  expandedComponents: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;

  // System context
  system: string;
}

const ComponentDisplayContext = createContext<ComponentDisplayContextType | undefined>(undefined);

interface ComponentDisplayProviderProps {
  children: ReactNode;
  projectId: string;
  selectedLandscape: string | null;
  selectedLandscapeData: any;
  isCentralLandscape: boolean;
  noCentralLandscapes: boolean;
  teamNamesMap: Record<string, string>;
  teamColorsMap: Record<string, string>;
  componentHealthMap: Record<string, ComponentHealthCheck>;
  isLoadingHealth: boolean;
  expandedComponents: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  system: string;
  components?: Array<{
    id: string;
    name: string;
    title?: string;
    description?: string;
    owner_id?: string | null;
    'central-service'?: boolean;
    [key: string]: any;
  }>;
}

export function ComponentDisplayProvider({
  children,
  projectId,
  selectedLandscape,
  selectedLandscapeData,
  isCentralLandscape,
  noCentralLandscapes,
  teamNamesMap,
  teamColorsMap,
  componentHealthMap,
  isLoadingHealth,
  expandedComponents,
  onToggleExpanded,
  system,
  components = [],
}: ComponentDisplayProviderProps) {
  const [componentSystemInfoMap, setComponentSystemInfoMap] = useState<Record<string, SystemInformation>>({});
  const [isLoadingSystemInfo, setIsLoadingSystemInfo] = useState(false);

  // Memoize component IDs to prevent unnecessary re-renders
  const componentIds = useMemo(() => {
    return components.map(c => c.id).sort().join(',');
  }, [components]);

  // Memoize landscape config to prevent unnecessary re-renders
  const landscapeConfig = useMemo(() => {
    if (!selectedLandscapeData) return null;
    return {
      id: selectedLandscapeData.id || 'default',
      name: selectedLandscapeData.name || 'default',
      route: selectedLandscapeData.metadata?.route ||
        selectedLandscapeData.landscape_url ||
        'cfapps.sap.hana.ondemand.com',
    };
  }, [selectedLandscapeData]);

  // Fetch system information for components when landscape or components change
  useEffect(() => {
    if (!landscapeConfig || !components.length) {
      setComponentSystemInfoMap({});
      setIsLoadingSystemInfo(false);
      return;
    }

    const abortController = new AbortController();
    setIsLoadingSystemInfo(true);

    const fetchSystemInfoForComponents = async () => {
      const systemInfoMap: Record<string, SystemInformation> = {};

      // Fetch system info for each component in parallel
      const promises = components.map(async (component) => {
        try {
          const isDisabled = component['central-service'] === true && !isCentralLandscape && !noCentralLandscapes;
          // Only fetch system info if component health is true, project is 'cis' and not disabled
          if (component.health !== true || projectId !== 'cis20' || isDisabled) {
            return;
          }

          // Create a proper Component object with required fields
          const componentForApi: Component = {
            id: component.id,
            name: component.name,
            title: component.title || component.name, // Use name as fallback for title
            description: component.description || '',
            owner_id: component.owner_id || '',
            github: component.github,
            qos: component.qos,
            sonar: component.sonar,
            metadata: component.metadata,
            'is-library': component['is-library'],
            health: component.health,
            'central-service': component['central-service']
          };


          const result = await fetchSystemInformation(
            componentForApi,
            landscapeConfig,
            abortController.signal
          );

          if (result.status === 'success' && result.data) {
            systemInfoMap[component.id] = result.data;
          }
        } catch (error) {
          // Silently handle individual component failures
          console.warn(`Failed to fetch system info for ${component.name}:`, error);
        }
      });

      await Promise.allSettled(promises);

      if (!abortController.signal.aborted) {
        setComponentSystemInfoMap(systemInfoMap);
        setIsLoadingSystemInfo(false);
      }
    };

    fetchSystemInfoForComponents();

    return () => {
      abortController.abort();
    };
  }, [landscapeConfig, componentIds, isCentralLandscape]);

  const value: ComponentDisplayContextType = {
    projectId,
    selectedLandscape,
    selectedLandscapeData,
    isCentralLandscape,
    noCentralLandscapes,
    teamNamesMap,
    teamColorsMap,
    componentHealthMap,
    isLoadingHealth,
    componentSystemInfoMap,
    isLoadingSystemInfo,
    expandedComponents,
    onToggleExpanded,
    system,
  };

  return (
    <ComponentDisplayContext.Provider value={value}>
      {children}
    </ComponentDisplayContext.Provider>
  );
}

export function useComponentDisplay() {
  const context = useContext(ComponentDisplayContext);
  if (context === undefined) {
    throw new Error('useComponentDisplay must be used within a ComponentDisplayProvider');
  }
  return context;
}
