import { useAppState } from './AppStateContext';
import { useData } from './DataContext';
import { useBusinessLogic } from './BusinessLogicContext';

export function usePortalState() {
  const appState = useAppState();
  
  return {
    activeTab: appState.activeTab,
    setActiveTab: appState.setActiveTab,
    currentDevId: appState.currentDevId,
    setCurrentDevId: appState.setCurrentDevId,
    selectedComponent: appState.selectedComponent,
    setSelectedComponent: appState.setSelectedComponent,
    selectedLandscape: appState.selectedLandscape,
    setSelectedLandscape: appState.setSelectedLandscape,
    showLandscapeDetails: appState.showLandscapeDetails,
    setShowLandscapeDetails: appState.setShowLandscapeDetails,
    meHighlightNotifications: appState.meHighlightNotifications,
    setMeHighlightNotifications: appState.setMeHighlightNotifications,
  };
}

export function useFeatureToggles() {
  const data = useData();
  const businessLogic = useBusinessLogic();
  
  return {
    featureToggles: data.featureToggles,
    setFeatureToggles: data.setFeatureToggles,
    expandedToggles: data.expandedToggles,
    setExpandedToggles: data.setExpandedToggles,
    toggleFilter: data.toggleFilter,
    setToggleFilter: data.setToggleFilter,
    toggleFeature: (toggleId: string, landscape: string) => 
      businessLogic.toggleFeature(toggleId, landscape, data.setFeatureToggles),
    toggleExpanded: (toggleId: string) => 
      businessLogic.toggleExpanded(toggleId, data.setExpandedToggles),
    bulkToggle: (toggleId: string, group: string, enable: boolean, landscapeGroups: Record<string, any[]>) => 
      businessLogic.bulkToggle(toggleId, group, enable, landscapeGroups, data.setFeatureToggles),
    getGroupStatus: businessLogic.getGroupStatus,
    getFilteredToggles: (activeProject: string, selectedLandscape: string | null, componentFilter: string, toggleFilter: string) => 
      businessLogic.getFilteredToggles(activeProject, selectedLandscape, componentFilter, toggleFilter, data.featureToggles),
  };
}

export function useRateLimiting() {
  const data = useData();
  return {
    rateLimitRules: data.rateLimitRules,
    setRateLimitRules: data.setRateLimitRules,
  };
}

export function useLogLevels() {
  const data = useData();
  return {
    logLevels: data.logLevels,
    setLogLevels: data.setLogLevels,
  };
}

export function useComponentManagement() {
  const data = useData();
  const appState = useAppState();
  
  return {
    expandedComponents: data.expandedComponents,
    setExpandedComponents: data.setExpandedComponents,
    componentFilter: data.componentFilter,
    setComponentFilter: data.setComponentFilter,
    timelineViewMode: appState.timelineViewMode,
    setTimelineViewMode: appState.setTimelineViewMode,
    getAvailableComponents: data.getAvailableComponents,
  };
}

export function useLandscapeManagement() {
  const businessLogic = useBusinessLogic();
  return {
    getCurrentProjectLandscapes: businessLogic.getCurrentProjectLandscapes,
    getLandscapeGroups: businessLogic.getLandscapeGroups,
    getFilteredLandscapeIds: businessLogic.getFilteredLandscapeIds,
    getProductionLandscapeIds: businessLogic.getProductionLandscapeIds,
    getDefaultLandscape: businessLogic.getDefaultLandscape,
  };
}

export function useHealthAndAlerts() {
  const data = useData();
  return {
    getComponentHealth: data.getComponentHealth,
    getComponentAlerts: data.getComponentAlerts,
    getDeployedVersion: data.getDeployedVersion,
    getStatusColor: data.getStatusColor,
  };
}
