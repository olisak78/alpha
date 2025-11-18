import { useState, useMemo, useEffect } from "react";
import cisTimelines from "@/data/cis-timelines.json";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { useTeams } from "@/hooks/api/useTeams";
import { componentVersions } from "@/types/developer-portal";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useComponentManagement, useFeatureToggles, useLandscapeManagement, usePortalState } from "@/contexts/hooks";
import { useTabRouting } from "@/hooks/useTabRouting";
import { filterComponentsByLandscape, getLibraryComponents } from "@/utils/componentFiltering";
import { useHealth } from "@/hooks/api/useHealth";
import type { ComponentHealthCheck } from "@/types/health";
import { useNavigate } from "react-router-dom";
import { CisTabContent } from "@/components/CisTabContent";

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
  const navigate = useNavigate();
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

  const handleComponentClick = (componentName: string) => {
    navigate(`/cis/component/${componentName}`);
  };

  return (
    <>
      <BreadcrumbPage>
        <CisTabContent
          activeTab={activeTab}
          componentView={componentView}
          onViewChange={setComponentView}
          selectedLandscape={selectedLandscape}
          selectedApiLandscape={selectedApiLandscape}
          landscapeGroups={landscapeGroups}
          currentProjectLandscapes={currentProjectLandscapes}
          onLandscapeChange={setSelectedLandscape}
          onShowLandscapeDetails={() => setShowLandscapeDetails(true)}
          filteredComponents={filteredComponents}
          libraryComponents={libraryComponents}
          cisComponentsLoading={cisComponentsLoading}
          cisComponentsError={cisComponentsError}
          teamComponentsExpanded={teamComponentsExpanded}
          onToggleExpanded={handleToggleComponentExpansion}
          refetchCisComponents={refetchCisComponents}
          onComponentClick={handleComponentClick}
          componentSearchTerm={componentSearchTerm}
          onSearchTermChange={setComponentSearchTerm}
          componentSortOrder={componentSortOrder}
          onSortOrderChange={setComponentSortOrder}
          teamNamesMap={teamNamesMap}
          teamColorsMap={teamColorsMap}
          componentHealthMap={componentHealthMap}
          isLoadingHealth={isLoadingHealth}
          healthChecks={healthChecks}
          summary={summary}
          filteredToggles={filteredToggles}
          expandedToggles={expandedToggles}
          toggleFilter={toggleFilter}
          componentFilter={componentFilter}
          availableComponents={availableComponents}
          activeProject={activeProject}
          onToggleFeature={toggleFeature}
          onToggleExpandedFeature={toggleExpanded}
          onBulkToggle={bulkToggle}
          onToggleFilterChange={setToggleFilter}
          onComponentFilterChange={setComponentFilter}
          getFilteredLandscapeIds={getFilteredLandscapeIds}
          getProductionLandscapeIds={getProductionLandscapeIds}
          getGroupStatus={getGroupStatus}
          cisTimelines={cisTimelines}
          componentVersions={componentVersions}
          timelineViewMode={timelineViewMode}
          onTimelineViewModeChange={setTimelineViewMode}
        />
      </BreadcrumbPage>
    </>
  );
}