import { useState, useMemo, useEffect } from "react";
import cisTimelines from "@/data/cis-timelines.json";
import AskOCTab from "@/components/AskOCTab";
import DeliveryTab from "@/components/DeliveryTab";
import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import FeatureToggleTab from "@/components/tabs/FeatureToggleTab";
import TimelinesTab from "@/components/tabs/TimelinesTab";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { useTeams } from "@/hooks/api/useTeams";
import { componentVersions} from "@/types/developer-portal";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useComponentManagement, useFeatureToggles, useLandscapeManagement, usePortalState } from "@/contexts/hooks";
import { useTabRouting } from "@/hooks/useTabRouting";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { filterComponentsByLandscape, getLibraryComponents } from "@/utils/componentFiltering";
import AlertsPage from "./AlertsPage";
import { useHealth } from "@/hooks/api/useHealth";
import type { ComponentHealthCheck } from "@/types/health";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { HealthOverview, HealthTable } from "@/components/Health";

const TAB_VISIBILITY = {
  components: true,
  health: false,              
  alerts: true,             
  'feature-toggle': false,   
  delivery: false,           
  timelines: false,        
  askoc: false              
} as const;

export default function CisPage() {
  const [activeTab, setActiveTab] = useState("components");
  const [componentView, setComponentView] = useState<'grid' | 'table'>('grid');
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [componentSortOrder, setComponentSortOrder] = useState<'alphabetic' | 'team'>('alphabetic');
  const { setTabs, activeTab: headerActiveTab, setActiveTab: setHeaderActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();

  const {
    selectedLandscape,
    setSelectedLandscape,
    setShowLandscapeDetails,
  } = usePortalState();

  const {
    getCurrentProjectLandscapes,
    getLandscapeGroups,
    getFilteredLandscapeIds,
    getProductionLandscapeIds,
  } = useLandscapeManagement();

  const {
    componentFilter,
    setComponentFilter,
    timelineViewMode,
    setTimelineViewMode,
    getAvailableComponents,
  } = useComponentManagement();

  const {
    featureToggles,
    expandedToggles,
    toggleFilter,
    setToggleFilter,
    toggleFeature,
    toggleExpanded,
    bulkToggle,
    getGroupStatus,
    getFilteredToggles,
  } = useFeatureToggles();

  const activeProject = "CIS@2.0";
  
  const {
    data: cisComponentsData,
    isLoading: cisComponentsLoading,
    error: cisComponentsError,
    refetch: refetchCisComponents
  } = useComponentsByProject('cis20');

  const {
    data: apiLandscapes,
    isLoading: isLoadingApiLandscapes,
  } = useLandscapesByProject('cis20');

  const { data: teamsData } = useTeams();
  const cisApiComponents = cisComponentsData || [];
  

  // Create a mapping of team ID to team name
  const teamNamesMap = useMemo(() => {
    if (!teamsData?.teams) return {};
    return teamsData.teams.reduce((acc, team) => {
      acc[team.id] = team.name;
      return acc;
    }, {} as Record<string, string>);
  }, [teamsData]);

  // Create a mapping of team ID to team color
  const teamColorsMap = useMemo(() => {
    if (!teamsData?.teams) return {};
    return teamsData.teams.reduce((acc, team) => {
      // Metadata might be a string that needs parsing
      let metadata = team.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.error('Failed to parse team metadata:', e);
        }
      }
      if (metadata?.color) {
        acc[team.id] = metadata.color;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [teamsData]);

  // Get data from context functions
  const currentProjectLandscapes = getCurrentProjectLandscapes(activeProject);
  const landscapeGroups = getLandscapeGroups(activeProject);
  const availableComponents = getAvailableComponents(activeProject, featureToggles);
  const filteredToggles = getFilteredToggles(activeProject, selectedLandscape, componentFilter, toggleFilter);

  // Find the selected landscape from API data and filter components based on metadata
  const selectedApiLandscape = useMemo(() => {
    return apiLandscapes?.find((l: any) => l.id === selectedLandscape);
  }, [apiLandscapes, selectedLandscape]);

  // Filter components based on landscape metadata
  const filteredComponents = useMemo(() => {
    if (!selectedLandscape) {
      const allNonLibrary = cisApiComponents.filter(c => !c.metadata?.['isLibrary']);
      return allNonLibrary.sort((a, b) => a.name.localeCompare(b.name));
    }

    const filtered = filterComponentsByLandscape(cisApiComponents, selectedApiLandscape?.metadata);
    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [cisApiComponents, selectedApiLandscape, selectedLandscape]);

  const libraryComponents = useMemo(() => {
    const libraries = getLibraryComponents(cisApiComponents);
    return libraries.sort((a, b) => a.name.localeCompare(b.name));
  }, [cisApiComponents]);

  // Create landscape groups from API data for Health Dashboard
  const apiLandscapeGroups = useMemo(() => {
    if (!apiLandscapes) return {};

    const groups: Record<string, typeof apiLandscapes> = {};
    apiLandscapes.forEach((landscape: any) => {
      const env = landscape.environment || 'Other';
      if (!groups[env]) {
        groups[env] = [];
      }
      groups[env].push(landscape);
    });

    return groups;
  }, [apiLandscapes]);

  const landscapeConfig = useMemo(() => {
    if (!selectedApiLandscape) return null;
    
    const route = selectedApiLandscape.metadata?.route || 
                  selectedApiLandscape.landscape_url || 
                  'sap.hana.ondemand.com';
    
    
    return {
      name: selectedApiLandscape.name,
      route: route
    };
  }, [selectedApiLandscape]);

  const {
    components: healthChecks,
    isLoading: isLoadingHealth,
    summary,
  } = useHealth({
    components: filteredComponents,
    landscape: landscapeConfig || { name: '', route: '' },
    enabled: !!selectedLandscape && !!landscapeConfig && activeTab === 'components'
  });

  const componentHealthMap = useMemo(() => {
    const map: Record<string, ComponentHealthCheck> = {};
    healthChecks.forEach(check => {
      map[check.componentId] = check;
    });
    return map;
  }, [healthChecks, filteredComponents]);

  // Memoize header tabs
  const headerTabs = useMemo(() => [
    { id: "components", label: "Components" },
    { id: "health", label: "Health" },
    { id: "alerts", label: "Alerts" },
    { id: "feature-toggle", label: "Feature Toggle" },
    { id: "delivery", label: "Delivery" },
    { id: "timelines", label: "Timelines" },
    { id: "askoc", label: "AskOC" }
  ].filter(tab => TAB_VISIBILITY[tab.id as keyof typeof TAB_VISIBILITY]), []);

  useEffect(() => {
    setTabs(headerTabs);
    syncTabWithUrl(headerTabs, "components");
  }, [setTabs, headerTabs, syncTabWithUrl]);

  // Update local activeTab when URL tab changes
  useEffect(() => {
    if (currentTabFromUrl && currentTabFromUrl !== activeTab) {
      setActiveTab(currentTabFromUrl);
    }
  }, [currentTabFromUrl]);

  // Sync local activeTab with header activeTab when header tab is clicked
  useEffect(() => {
    if (headerActiveTab && headerActiveTab !== activeTab) {
      setActiveTab(headerActiveTab);
    }
  }, [headerActiveTab, activeTab]);

  const handleToggleComponentExpansion = (componentId: string) => {
    setTeamComponentsExpanded(prev => ({
      ...prev,
      [componentId]: !(prev[componentId] ?? false)
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "components":
        return (
          <>
            <LandscapeLinksSection
              selectedLandscape={selectedLandscape}
              selectedLandscapeData={selectedApiLandscape}
              landscapeGroups={landscapeGroups}
              onLandscapeChange={setSelectedLandscape}
              onShowLandscapeDetails={() => setShowLandscapeDetails(true)}
              hiddenButtons={['plutono']}
            />
           {componentView === 'grid' ? (
              <>
                <ComponentsTabContent
                  title="CIS Cloud Foundry Components"
                  components={filteredComponents}
                  teamName="CIS Cloud Foundry"
                  isLoading={cisComponentsLoading}
                  error={cisComponentsError}
                  teamComponentsExpanded={teamComponentsExpanded}
                  onToggleExpanded={handleToggleComponentExpansion}
                  onRefresh={refetchCisComponents}
                  showRefreshButton={false}
                  emptyStateMessage="No CIS components found for this organization."
                  searchTerm={componentSearchTerm}
                  onSearchTermChange={setComponentSearchTerm}
                  system="cis"
                  showLandscapeFilter={true}
                  selectedLandscape={selectedLandscape}
                  selectedLandscapeData={selectedApiLandscape}
                  teamNamesMap={teamNamesMap}
                  teamColorsMap={teamColorsMap}
                  sortOrder={componentSortOrder}
                  onSortOrderChange={setComponentSortOrder}
                  componentHealthMap={componentHealthMap}
                  isLoadingHealth={isLoadingHealth}
                  viewSwitcher={
                    <ViewSwitcher view={componentView} onViewChange={setComponentView} />
                  }
                />

                {libraryComponents.length > 0 && (
                  <div className="mt-8">
                    <ComponentsTabContent
                      title="CIS Cloud Foundry Libraries"
                      components={libraryComponents}
                      teamName="CIS Cloud Foundry Libraries"
                      isLoading={cisComponentsLoading}
                      error={cisComponentsError}
                      teamComponentsExpanded={teamComponentsExpanded}
                      onToggleExpanded={handleToggleComponentExpansion}
                      onRefresh={refetchCisComponents}
                      showRefreshButton={false}
                      emptyStateMessage="No CIS library components found."
                      searchTerm={componentSearchTerm}
                      system="cis"
                      teamNamesMap={teamNamesMap}
                      teamColorsMap={teamColorsMap}
                      sortOrder={componentSortOrder}
                      onSortOrderChange={setComponentSortOrder}
                      componentHealthMap={{}}
                      isLoadingHealth={false}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Component Health</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Real-time health status of all components
                      {selectedApiLandscape && ` in ${selectedApiLandscape.name}`}
                    </p>
                  </div>
                  <ViewSwitcher view={componentView} onViewChange={setComponentView} />
                </div>

                {selectedLandscape && filteredComponents.length > 0 ? (
                  <>
                    <HealthOverview summary={summary} isLoading={isLoadingHealth} />
                    <HealthTable
                      healthChecks={healthChecks}
                      isLoading={isLoadingHealth}
                      landscape={selectedApiLandscape?.name || ''}
                    />
                  </>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <p className="text-muted-foreground">
                      {!selectedLandscape 
                        ? 'Select a landscape to view component health status'
                        : 'No components found in this landscape'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        );
      case "alerts":
        return <AlertsPage projectId="cis20" projectName="CIS@2.0" />;
      case "feature-toggle":
        return (
          <FeatureToggleTab
            featureToggles={filteredToggles}
            selectedLandscape={selectedLandscape}
            selectedLandscapeName={currentProjectLandscapes.find(l => l.id === selectedLandscape)?.name}
            landscapeGroups={landscapeGroups}
            expandedToggles={expandedToggles}
            toggleFilter={toggleFilter}
            componentFilter={componentFilter}
            availableComponents={availableComponents}
            activeProject={activeProject}
            onToggleFeature={toggleFeature}
            onToggleExpanded={toggleExpanded}
            onBulkToggle={bulkToggle}
            onToggleFilterChange={setToggleFilter}
            onComponentFilterChange={setComponentFilter}
            getFilteredLandscapeIds={getFilteredLandscapeIds}
            getProductionLandscapeIds={getProductionLandscapeIds}
            getGroupStatus={getGroupStatus}
          />
        );
      case "delivery":
        return <DeliveryTab selectedLandscape={selectedLandscape}
          landscapes={currentProjectLandscapes} />;
      case "timelines":
        return (
          <TimelinesTab
            selectedLandscape={selectedLandscape}
            cisTimelines={cisTimelines}
            componentVersions={componentVersions}
            timelineViewMode={timelineViewMode}
            onTimelineViewModeChange={setTimelineViewMode}
          />
        );
      case "askoc":
        return <AskOCTab />;
      default:
        return null;
    }
  };

  return (
    <>
      <BreadcrumbPage>
        {/* Tab Content */}
        {renderTabContent()}
      </BreadcrumbPage>

    </>
  );
}