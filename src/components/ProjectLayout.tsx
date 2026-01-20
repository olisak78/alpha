import { useState, useMemo, useEffect, ReactNode, useCallback } from "react";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { HealthDashboard } from "@/components/Health/HealthDashboard";
import AlertsPage from "@/pages/AlertsPage";
import MonitoringPage from "@/pages/MonitoringPage";
import { DeploymentTab } from "@/components/tabs/DeploymentTab";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useLandscapeSelection, useSelectedLandscapeForProject, useUIActions } from "@/stores/appStateStore";
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
import { Button } from "./ui/button";
import { Filter } from "lucide-react";

export interface ProjectLayoutProps {
  projectName: string;
  projectId: string;
  defaultTab?: string;
  tabs: string[]; // Array of tab IDs from database
  componentsTitle?: string;
  emptyStateMessage?: string;
  system?: string;
  showLandscapeFilter?: boolean;
  alertsUrl?: string;
  children?: ReactNode;
}

export function ProjectLayout({
  projectName,
  projectId,
  defaultTab = "components",
  tabs,
  emptyStateMessage,
  system = "services",
  showLandscapeFilter = false,
  alertsUrl,
  children
}: ProjectLayoutProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [componentSortOrder, setComponentSortOrder] = useState<'alphabetic' | 'team'>('alphabetic');
  const [componentView, setComponentView] = useState<'grid' | 'table'>('grid');
  const [hideDownComponents, setHideDownComponents] = useState(false);
  const [showProvidersOnly, setShowProvidersOnly] = useState(false);


  // Navigation and routing hooks
  const { setTabs, activeTab: headerActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();

  const { getSelectedLandscapeForProject, setSelectedLandscapeForProject } = useLandscapeSelection();
  const { setShowLandscapeDetails } = useUIActions();

  const selectedLandscape = useSelectedLandscapeForProject(projectId);

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
    if (!selectedApiLandscape) return { id: '', name: '', route: '' };

    return {
      id: selectedApiLandscape.id,
      name: selectedApiLandscape.name,
      route: selectedApiLandscape.metadata?.route ||
        selectedApiLandscape.landscape_url ||
        'cfapps.sap.hana.ondemand.com',
    };
  }, [selectedApiLandscape]);

  // Check if there are any landscapes available
  const hasLandscapes = useMemo(() => {
    return apiLandscapes && apiLandscapes.length > 0;
  }, [apiLandscapes]);

  const isCentralLandscape = useMemo(() => {
    return selectedApiLandscape?.isCentral ?? false;
  }, [selectedApiLandscape]);

  // Check if there are no central landscapes available
  const noCentralLandscapes = useMemo(() => {
    if (!apiLandscapes || apiLandscapes.length === 0) return true;
    return !apiLandscapes.some((landscape: any) => landscape.isCentral === true);
  }, [apiLandscapes]);

  // Health data hook - only enabled when landscapes are available
  const {
    healthChecks,
    summary,
    isLoading: isLoadingHealth,
  } = useHealth({
    components: apiComponents,
    landscape: landscapeConfig,
    enabled: hasLandscapes && !!selectedLandscape && !componentsLoading,
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
    return tabId.charAt(0).toUpperCase() + tabId.slice(1);
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
    // If hideDownComponents is false OR landscape is central, show all components
    if (!hideDownComponents || isCentralLandscape) {
      return apiComponents;
    }

    // If hideDownComponents is true AND landscape is not central, hide central components
    return apiComponents.filter(component => {
      return component['central-service'] !== true;
    });
  }, [apiComponents, hideDownComponents, isCentralLandscape]);

  const hasProviderComponents = useMemo(() => {
    return apiComponents.some(component =>
      (component.name || '').toLowerCase().includes('provider') ||
      (component.title || '').toLowerCase().includes('provider')
    );
  }, [apiComponents]);

  const displayedComponents = useMemo(() => {
    if (!showProvidersOnly) {
      return visibleComponents;
    }

    return visibleComponents.filter(component =>
      (component.name || '').toLowerCase().includes('provider') ||
      (component.title || '').toLowerCase().includes('provider')
    );
  }, [visibleComponents, showProvidersOnly]);

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

            {/* All projects now support both grid and table views */}
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
                      {!noCentralLandscapes && (<HealthStatusFilter
                        hideDownComponents={hideDownComponents}
                        onToggle={setHideDownComponents}
                      />)}
                      <ViewSwitcher view={componentView} onViewChange={setComponentView} />
                    </div>
                  </div>

                  {selectedLandscape && visibleComponents.length > 0 ? (
                    <ComponentsTabContent
                      title=""
                      components={displayedComponents}
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
                      componentHealthMap={componentHealthMap}
                      isLoadingHealth={isLoadingHealth}
                      onComponentClick={handleComponentClick}
                      isCentralLandscape={isCentralLandscape}
                      noCentralLandscapes={noCentralLandscapes}
                      summary={summary}
                      isLoadingHealthSummary={isLoadingHealth}
                      projectId={projectId}
                      showProvidersOnly={showProvidersOnly}
                      onShowProvidersOnlyChange={setShowProvidersOnly}
                      hasProviderComponents={hasProviderComponents}
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
                      {!noCentralLandscapes && (<HealthStatusFilter
                        hideDownComponents={hideDownComponents}
                        onToggle={setHideDownComponents}
                      />)}
                      <ViewSwitcher view={componentView} onViewChange={setComponentView} />
                    </div>
                  </div>

                  {selectedLandscape && displayedComponents.length > 0 ? (
                    <ComponentDisplayProvider
                      projectId={projectId}
                      selectedLandscape={selectedLandscape}
                      selectedLandscapeData={selectedApiLandscape}
                      isCentralLandscape={isCentralLandscape}
                      noCentralLandscapes={noCentralLandscapes}
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
                        components={displayedComponents}
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
        );
      case "health":
        return (
          <ComponentDisplayProvider
            projectId={projectId}
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedApiLandscape}
            isCentralLandscape={isCentralLandscape}
            noCentralLandscapes={noCentralLandscapes}
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
      case "monitoring":
        return (
          <MonitoringPage
            projectId={projectId}
            projectName={projectName}
            alertsUrl={alertsUrl}
          />
        );
      case "deployment":
        return (
          <>
            {/* Header with landscape selector */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Deployment</h2>
              <div className="w-80">
                <LandscapeFilter
                  selectedLandscape={selectedLandscape}
                  landscapeGroups={landscapeGroupsRecord}
                  onLandscapeChange={handleLandscapeChange}
                  onShowLandscapeDetails={handleShowLandscapeDetails}
                  showClearButton={false}
                  showViewAllButton={false}
                  projectId={projectId}
                />
              </div>
            </div>
            <DeploymentTab
              projectId={projectId}
              selectedLandscape={selectedApiLandscape?.technical_name}
              landscapeData={selectedApiLandscape}
            />
          </>
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