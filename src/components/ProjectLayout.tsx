import { useState, useMemo, useEffect, ReactNode, useCallback } from "react";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { HealthDashboard } from "@/components/Health/HealthDashboard";
import AlertsPage from "@/pages/AlertsPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import {
  usePortalState,
} from "@/contexts/hooks";
import { useTabRouting } from "@/hooks/useTabRouting";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { useTeams } from "@/hooks/api/useTeams";
import { useHealth } from "@/hooks/api/useHealth";
import { getDefaultLandscapeId } from "@/services/LandscapesApi";
import type { Landscape } from "@/types/developer-portal";
import { useNavigate } from "react-router-dom";
import { HealthTable } from "./Health/HealthTable";
import { ViewSwitcher } from "./ViewSwitcher";
import { Badge } from "./ui/badge";
import { HealthStatusFilter } from "./HealthStatusFilter";
import { ComponentDisplayProvider } from "@/contexts/ComponentDisplayContext";

export interface ProjectLayoutProps {
  projectName: string;
  projectId: string;
  defaultTab?: string;
  tabs: string[]; // Array of tab IDs from database
  componentsTitle?: string;
  emptyStateMessage?: string;
  system?: string;
  showLandscapeFilter?: boolean;
  showComponentsMetrics?: boolean;
  alertsUrl?: string;
  children?: ReactNode;
}

export function ProjectLayout({
  projectName,
  projectId,
  defaultTab = "components",
  tabs,
  componentsTitle,
  emptyStateMessage,
  system = "services",
  showLandscapeFilter = false,
  showComponentsMetrics = false,
  alertsUrl,
  children
}: ProjectLayoutProps) {
  // Common state management
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [componentSortOrder, setComponentSortOrder] = useState<'alphabetic' | 'team'>('alphabetic');
  const [componentView, setComponentView] = useState<'grid' | 'table'>('grid');
  const [hideDownComponents, setHideDownComponents] = useState(false);

  // Navigation and routing hooks
  const { setTabs, activeTab: headerActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();

  // Context hooks
  const {
    getSelectedLandscapeForProject,
    setSelectedLandscapeForProject,
    setShowLandscapeDetails
  } = usePortalState();

  // Get project-specific selected landscape (reactive to changes)
  const selectedLandscape = useMemo(() => {
    return getSelectedLandscapeForProject(projectId);
  }, [getSelectedLandscapeForProject, projectId]);

  // API hooks
  const {
    data: componentsData,
    isLoading: componentsLoading,
    error: componentsError,
    refetch: refetchComponents
  } = useComponentsByProject(projectId);

  const {
    data: apiLandscapes,
    isLoading: landscapesLoading
  } = useLandscapesByProject(projectId);

  const { data: teamsData } = useTeams();

  // Process components data - ComponentListResponse is directly Component[]
  const apiComponents = useMemo(() => {
    return componentsData || [];
  }, [componentsData]);

  // Process landscapes data
  const landscapeGroupsRecord = useMemo(() => {
    if (!apiLandscapes) return {};

    // Group landscapes by environment_group
    const groups: Record<string, Landscape[]> = {};
    apiLandscapes.forEach((landscape) => {
      const group = landscape.environment || 'Other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(landscape);
    });
    return groups;
  }, [apiLandscapes]);

  const landscapeGroupsArray = useMemo(() => {
    return Object.entries(landscapeGroupsRecord).map(([name, landscapes]) => ({
      id: name,
      name,
      landscapes: landscapes.map(l => ({
        id: l.id,
        name: l.technical_name,
        isCentral: l.isCentral || false
      }))
    }));
  }, [landscapeGroupsRecord]);


  // Find selected landscape object
  const selectedApiLandscape = useMemo(() => {
    if (!selectedLandscape || !apiLandscapes) return null;
    return apiLandscapes.find((l) => l.id === selectedLandscape) || null;
  }, [selectedLandscape, apiLandscapes]);

  // Build landscape config for health checks
  const landscapeConfig = useMemo(() => {
    if (!selectedApiLandscape) return { name: '', route: '' };

    return {
      name: selectedApiLandscape.name,
      route: selectedApiLandscape.metadata?.route ||
        selectedApiLandscape.landscape_url ||
        'cfapps.sap.hana.ondemand.com',
    };
  }, [selectedApiLandscape]);

  const isCentralLandscape = useMemo(() => {
    return selectedApiLandscape?.isCentral ?? false;
  }, [selectedApiLandscape]);

  // Health data hook - only fetch if showComponentsMetrics is true
  const {
    healthChecks,
    summary,
    isLoading: isLoadingHealth,
  } = useHealth({
    components: apiComponents,
    landscape: landscapeConfig,
    enabled: showComponentsMetrics && !!selectedLandscape && !componentsLoading,
    isCentralLandscape
  });

  // Create a map of component health by component ID
  const componentHealthMap = useMemo(() => {
    return healthChecks.reduce((acc: Record<string, any>, check) => {
      acc[check.componentId] = check;
      return acc;
    }, {});
  }, [healthChecks]);

  // Build team maps
  const teamNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (teamsData?.teams) {
      teamsData.teams.forEach((team: any) => {
        map[team.id] = team.title || team.name;
      });
    }
    return map;
  }, [teamsData]);

  const teamColorsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (teamsData?.teams) {
      teamsData.teams.forEach((team: any) => {
        map[team.id] = team.metadata?.color;
      });
    }
    return map;
  }, [teamsData]);

  // Tab label mapping
  const getTabLabel = (tabId: string): string => {
    const labelMap: Record<string, string> = {
      'components': 'Components',
      'health': 'Health',
      'alerts': 'Alerts',
    };
    return labelMap[tabId] || tabId.charAt(0).toUpperCase() + tabId.slice(1);
  };

  // Build header tabs from database array
  const headerTabs = useMemo(() => {
    return tabs.map(tabId => ({
      id: tabId,
      label: getTabLabel(tabId)
    }));
  }, [tabs]);

  // Set up header tabs and sync with URL
  useEffect(() => {
    syncTabWithUrl(headerTabs, defaultTab);
  }, [headerTabs, defaultTab, syncTabWithUrl]);

  // Update local activeTab when URL tab changes
  useEffect(() => {
    if (currentTabFromUrl && currentTabFromUrl !== activeTab) {
      setActiveTab(currentTabFromUrl);
    }
  }, [currentTabFromUrl, activeTab]);

  // Sync local activeTab with header activeTab when header tab is clicked
  useEffect(() => {
    if (headerActiveTab && headerActiveTab !== activeTab) {
      setActiveTab(headerActiveTab);
    }
  }, [headerActiveTab, activeTab]);

  // Set default landscape if no valid landscape is selected for this project
  useEffect(() => {
    if (apiLandscapes && apiLandscapes.length > 0) {
      // Check if there's a valid landscape selection for this project
      const currentSelection = getSelectedLandscapeForProject(projectId);
      const isValidSelection = currentSelection &&
        apiLandscapes.some(landscape => landscape.id === currentSelection);

      // If no valid selection exists, set the default
      if (!isValidSelection) {
        const defaultLandscapeId = getDefaultLandscapeId(apiLandscapes, projectId);
        if (defaultLandscapeId) {
          setSelectedLandscapeForProject(projectId, defaultLandscapeId);
        }
      }
    }
  }, [apiLandscapes, setSelectedLandscapeForProject, projectId, getSelectedLandscapeForProject]);

  // Handlers
  const handleToggleComponentExpansion = (componentId: string) => {
    setTeamComponentsExpanded(prev => ({
      ...prev,
      [componentId]: !(prev[componentId] ?? false)
    }));
  };

  const visibleComponents = useMemo(() => {
    if (!hideDownComponents || !showComponentsMetrics) {
      return apiComponents;
    }

    // Filter out components with non-UP status
    return apiComponents.filter(component => {
      const isDisabledCentralComponent = component['central-service'] === true && !isCentralLandscape;

      // If it's a disabled central component, hide it when hideDownComponents is true
      if (isDisabledCentralComponent) {
        return false;
      }
      const healthCheck = componentHealthMap[component.id];
      // Keep component if no health check or if status is UP
      return !healthCheck || healthCheck.status === 'UP';
    });
  }, [apiComponents, hideDownComponents, showComponentsMetrics, componentHealthMap, isCentralLandscape]);

  const handleComponentClick = (componentName: string) => {
    navigate(`/${projectId}/component/${componentName}`);
  };

  const handleLandscapeChange = useCallback((landscapeId: string | null) => {
    setSelectedLandscapeForProject(projectId, landscapeId);
  }, [projectId, setSelectedLandscapeForProject]);

  const handleShowLandscapeDetails = useCallback(() => {
    setShowLandscapeDetails(true);
  }, [setShowLandscapeDetails]);

  const renderGenericTabContent = () => {
    switch (activeTab) {
      case "components":
        return (
          <>
            {/* Landscape Links Section */}
            <LandscapeLinksSection
              selectedLandscape={selectedLandscape}
              selectedLandscapeData={selectedApiLandscape}
              landscapeGroups={landscapeGroupsArray}
              onLandscapeChange={handleLandscapeChange}
              onShowLandscapeDetails={handleShowLandscapeDetails} 
              projectId={projectId}
            />

            {/* Conditional rendering based on showComponentsMetrics and view */}
            {showComponentsMetrics ? (
              // When showComponentsMetrics is true, show view switcher with grid/table views
              <>
                {componentView === 'grid' ? (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold">Components</h2>
                          {selectedLandscape && visibleComponents.length > 0 && (
                            <Badge variant="secondary" className="text-sm">
                              {visibleComponents.length}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">

                          <HealthStatusFilter
                            hideDownComponents={hideDownComponents}
                            onToggle={setHideDownComponents}
                          />
                          <ViewSwitcher view={componentView} onViewChange={setComponentView} />
                        </div>
                      </div>

                      {selectedLandscape && visibleComponents.length > 0 ? (
                        <ComponentsTabContent
                          title=""
                          components={visibleComponents}
                          teamName={projectName}
                          isLoading={componentsLoading}
                          error={componentsError}
                          teamComponentsExpanded={teamComponentsExpanded}
                          onToggleExpanded={handleToggleComponentExpansion}
                          onRefresh={refetchComponents}
                          showRefreshButton={false}
                          emptyStateMessage={emptyStateMessage || `No ${projectName} components found for this organization.`}
                          searchTerm={componentSearchTerm}
                          onSearchTermChange={setComponentSearchTerm}
                          system={system}
                          showLandscapeFilter={showLandscapeFilter}
                          showComponentMetrics={showComponentsMetrics}
                          selectedLandscape={selectedLandscape}
                          selectedLandscapeData={selectedApiLandscape}
                          teamNamesMap={teamNamesMap}
                          teamColorsMap={teamColorsMap}
                          sortOrder={componentSortOrder}
                          onSortOrderChange={setComponentSortOrder}
                          componentHealthMap={componentHealthMap}
                          isLoadingHealth={isLoadingHealth}
                          onComponentClick={handleComponentClick}
                          isCentralLandscape={isCentralLandscape}
                          summary={summary}
                          isLoadingHealthSummary={isLoadingHealth}
                        />
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-12 text-center">
                          <p className="text-muted-foreground">
                            {!selectedLandscape
                              ? 'Select a landscape to view components'
                              : 'No components found in this landscape'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold">Components</h2>
                          {selectedLandscape && visibleComponents.length > 0 && (
                            <Badge variant="secondary" className="text-sm">
                              {visibleComponents.length}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <HealthStatusFilter
                            hideDownComponents={hideDownComponents}
                            onToggle={setHideDownComponents}
                          />
                          <ViewSwitcher view={componentView} onViewChange={setComponentView} />
                        </div>
                      </div>

                      {selectedLandscape && visibleComponents.length > 0 ? (
                        <ComponentDisplayProvider
                          selectedLandscape={selectedLandscape}
                          selectedLandscapeData={selectedApiLandscape}
                          isCentralLandscape={isCentralLandscape}
                          teamNamesMap={teamNamesMap}
                          teamColorsMap={teamColorsMap}
                          componentHealthMap={componentHealthMap}
                          isLoadingHealth={isLoadingHealth}
                          expandedComponents={teamComponentsExpanded}
                          onToggleExpanded={handleToggleComponentExpansion}
                          system={system}
                          components={visibleComponents}
                        >
                          <HealthTable
                            healthChecks={healthChecks}
                            isLoading={isLoadingHealth}
                            landscape={selectedApiLandscape?.name || ''}
                            components={visibleComponents}
                            onComponentClick={handleComponentClick}
                            hideDownComponents={hideDownComponents}
                            isCentralLandscape={isCentralLandscape}
                          />
                        </ComponentDisplayProvider>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-12 text-center">
                          <p className="text-muted-foreground">
                            {!selectedLandscape
                              ? 'Select a landscape to view component health status'
                              : hideDownComponents
                                ? 'No healthy components found in this landscape'
                                : 'No components found in this landscape'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              // When showComponentsMetrics is false, show traditional components view without switcher
              <ComponentsTabContent
                title={componentsTitle || `${projectName} Components`}
                components={apiComponents}
                teamName={projectName}
                isLoading={componentsLoading}
                error={componentsError}
                teamComponentsExpanded={teamComponentsExpanded}
                onToggleExpanded={handleToggleComponentExpansion}
                onRefresh={refetchComponents}
                showRefreshButton={false}
                emptyStateMessage={emptyStateMessage || `No ${projectName} components found for this organization.`}
                searchTerm={componentSearchTerm}
                onSearchTermChange={setComponentSearchTerm}
                system={system}
                showLandscapeFilter={showLandscapeFilter}
                selectedLandscape={selectedLandscape}
                selectedLandscapeData={selectedApiLandscape}
                teamNamesMap={teamNamesMap}
                teamColorsMap={teamColorsMap}
                sortOrder={componentSortOrder}
                onSortOrderChange={setComponentSortOrder}
                isCentralLandscape={isCentralLandscape}
                summary={summary}
                isLoadingHealthSummary={isLoadingHealth}
              />
            )}
          </>
        );
      case "health":
        return (
          <ComponentDisplayProvider
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedApiLandscape}
            isCentralLandscape={isCentralLandscape}
            teamNamesMap={teamNamesMap}
            teamColorsMap={teamColorsMap}
            componentHealthMap={componentHealthMap}
            isLoadingHealth={isLoadingHealth}
            expandedComponents={teamComponentsExpanded}
            onToggleExpanded={handleToggleComponentExpansion}
            system={system}
            components={apiComponents}
          >
            <HealthDashboard
              projectId={projectId}
              components={apiComponents}
              landscapeGroups={landscapeGroupsRecord}
              selectedLandscape={selectedLandscape}
              onLandscapeChange={(landscapeId) => setSelectedLandscapeForProject(projectId, landscapeId)}
              onShowLandscapeDetails={() => setShowLandscapeDetails(true)}
              isLoadingComponents={componentsLoading}
            />
          </ComponentDisplayProvider>
        );
      case "alerts":
        return (
          <AlertsPage
            projectId={projectId}
            projectName={projectName}
            alertsUrl={alertsUrl}
          />
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    return renderGenericTabContent();
  };

  return (
    <BreadcrumbPage>
      {children}
      {renderTabContent()}
    </BreadcrumbPage>
  );
}
