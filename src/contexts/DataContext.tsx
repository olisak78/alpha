import { createContext, useContext, useState, ReactNode } from 'react';
import { FeatureToggle, RateLimitRule, componentVersions } from '@/types/developer-portal';
import { mockFeatureToggles } from '@/data/mockFeatureToggles';
import { projectComponents} from '@/constants/developer-portal';

interface DataContextType {
  // Feature Toggles
  featureToggles: FeatureToggle[];
  setFeatureToggles: (toggles: FeatureToggle[] | ((prev: FeatureToggle[]) => FeatureToggle[])) => void;
  expandedToggles: Set<string>;
  setExpandedToggles: (expanded: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  toggleFilter: "all" | "all-enabled" | "all-disabled" | "mixed";
  setToggleFilter: (filter: "all" | "all-enabled" | "all-disabled" | "mixed") => void;
  
  // Rate Limiting & Logs
  //rateLimitRules: RateLimitRule[];
  //setRateLimitRules: (rules: RateLimitRule[] | ((prev: RateLimitRule[]) => RateLimitRule[])) => void;
  logLevels: Record<string, string>;
  setLogLevels: (levels: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  
  // Component State
  componentFilter: string;
  setComponentFilter: (filter: string) => void;
  expandedComponents: Record<string, boolean>;
  setExpandedComponents: (expanded: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  
  // Helper functions
  getComponentHealth: (componentId: string, landscape: string | null) => string;
  getComponentAlerts: (componentId: string, landscape: string | null) => boolean;
  getDeployedVersion: (compId: string | null, landscape: string | null) => string | null;
  getStatusColor: (status: string) => string;
  getAvailableComponents: (activeProject: string, featureToggles: FeatureToggle[]) => string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // Feature Toggles
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>(mockFeatureToggles);
  const [expandedToggles, setExpandedToggles] = useState<Set<string>>(new Set());
  const [toggleFilter, setToggleFilter] = useState<"all" | "all-enabled" | "all-disabled" | "mixed">("all");
  
  // Rate Limiting & Logs
  const [logLevels, setLogLevels] = useState<Record<string, string>>({});
  
  // Component State
  const [componentFilter, setComponentFilter] = useState<string>("all");
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});

  // Helper Functions
  const getComponentHealth = (componentId: string, landscape: string | null) => {
    if (!landscape) return "N/A";
    return  "UP";
  };

  const getComponentAlerts = (componentId: string, landscape: string | null) => {
    if (!landscape) return false;
    return false;
  };

  const getDeployedVersion = (compId: string | null, landscape: string | null): string | null => {
    if (!compId || !landscape) return null;
    const data = (componentVersions as Record<string, any[]>)[compId];
    const match = data?.find((d) => d.landscape === landscape);
    return match?.buildProperties?.version ?? null;
  };

  const getStatusColor = (status: string) => {
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
  };

  const getAvailableComponents = (activeProject: string, featureToggles: FeatureToggle[]) => {
    const currentProjectComponents = projectComponents[activeProject as keyof typeof projectComponents] || [];
    const toggleComponents = featureToggles
      .filter(toggle => currentProjectComponents.some(c => c.id === toggle.component))
      .map(toggle => toggle.component);
    
    return [...new Set(toggleComponents)].sort();
  };

  const value: DataContextType = {
    featureToggles,
    setFeatureToggles,
    expandedToggles,
    setExpandedToggles,
    toggleFilter,
    setToggleFilter,
    logLevels,
    setLogLevels,
    componentFilter,
    setComponentFilter,
    expandedComponents,
    setExpandedComponents,
    getComponentHealth,
    getComponentAlerts,
    getDeployedVersion,
    getStatusColor,
    getAvailableComponents,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
