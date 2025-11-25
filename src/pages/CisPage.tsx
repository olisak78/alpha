import { useState, useMemo, useEffect, useRef } from "react";
import cisTimelines from "@/data/cis-timelines.json";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { useTeams } from "@/hooks/api/useTeams";
import { componentVersions } from "@/types/developer-portal";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useComponentManagement, useFeatureToggles, useLandscapeManagement, usePortalState } from "@/contexts/hooks";
import { filterComponentsByLandscape, getLibraryComponents } from "@/utils/componentFiltering";
import { useHealth } from "@/hooks/api/useHealth";
import type { ComponentHealthCheck } from "@/types/health";
import { useNavigate } from "react-router-dom";
import { CisTabContent } from "@/components/CisTabContent";
import type { Landscape } from "@/types/developer-portal";

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
  const [componentView, setComponentView] = useState<'grid' | 'table'>('grid');
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const [componentSortOrder, setComponentSortOrder] = useState<'alphabetic' | 'team'>('alphabetic');
  const { setTabs, activeTab: headerActiveTab, setActiveTab: setHeaderActiveTab } = useHeaderNavigation();

  const hasInitializedLandscape = useRef(false);

  const {
    selectedLandscape,
    setSelectedLandscape,
    setShowLandscapeDetails,
  } = usePortalState();

  const {
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

  // Helper function to get default landscape
  const getDefaultLandscape = useMemo(() => {
    return (landscapes: any[]): string | null => {
      if (!landscapes || landscapes.length === 0) {
        return null;
      }

      // Priority 1: Find DEFAULT landscape
      const defaultLandscape = landscapes.find(
        (l: any) => l.name?.toLowerCase() === 'default'
      );
      if (defaultLandscape) {
        return defaultLandscape.id;
      }

      // Priority 2: Find central landscape
      const centralLandscape = landscapes.find((l: any) => l.isCentral);
      if (centralLandscape) {
        return centralLandscape.id;
      }

      // Priority 3: First production landscape
      const devPatterns = ['dev', 'staging', 'int', 'canary', 'hotfix', 'perf'];
      const prodLandscape = landscapes.find(
        (l: any) => !devPatterns.some(pattern => l.id?.toLowerCase().includes(pattern))
      );
      if (prodLandscape) {
        return prodLandscape.id;
      }

      // Priority 4: First landscape
      return landscapes[0].id;
    };
  }, []);

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

  const currentProjectLandscapes = useMemo(() => {
    return apiLandscapes || [];
  }, [apiLandscapes]);


  const landscapeGroupsRecord = useMemo(() => {
    if (!apiLandscapes || apiLandscapes.length === 0) return {};

    // Group by environment field from API response
    const groupedByEnvironment: Record<string, Landscape[]> = {};

    apiLandscapes.forEach((landscape: any) => {
      const environment = landscape.environment || 'Unknown';

      // Capitalize first letter for display
      const groupName = environment.charAt(0).toUpperCase() + environment.slice(1);

      if (!groupedByEnvironment[groupName]) {
        groupedByEnvironment[groupName] = [];
      }
      groupedByEnvironment[groupName].push(landscape);
    });

    return groupedByEnvironment;
  }, [apiLandscapes]);

  // Convert Record<string, Landscape[]> to array format for LandscapeLinksSection
  const landscapeGroups = useMemo(() => {
    return Object.entries(landscapeGroupsRecord).map(([groupName, landscapes]) => ({
      id: groupName,
      name: groupName,
      landscapes: landscapes.map(l => ({
        id: l.id,
        name: l.name,
        isCentral: l.isCentral || false
      }))
    }));
  }, [landscapeGroupsRecord]);

  const availableComponents = getAvailableComponents(activeProject, featureToggles);
  const filteredToggles = getFilteredToggles(activeProject, selectedLandscape, componentFilter, toggleFilter);

  // Find the selected landscape from API data and filter components based on metadata
  const selectedApiLandscape = useMemo(() => {
    return apiLandscapes?.find((l: any) => l.id === selectedLandscape);
  }, [apiLandscapes, selectedLandscape]);

  // Filter components based on landscape metadata
  const filteredComponents = useMemo(() => {
    if (!selectedLandscape) {
      const allNonLibrary = cisApiComponents.filter(c => !c['is-library']);
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
    healthChecks,
    isLoading: isLoadingHealth,
    summary,
    refetch,
    isFetching,
  } = useHealth({
    components: filteredComponents,
    landscape: landscapeConfig || { name: '', route: '' },
    enabled: !!selectedLandscape && !cisComponentsLoading && !isLoadingApiLandscapes && filteredComponents.length > 0,
  });

  // Create a map of component health by component ID
  const componentHealthMap = useMemo(() => {
    return healthChecks.reduce((acc: Record<string, ComponentHealthCheck>, check) => {
      acc[check.componentId] = check;
      return acc;
    }, {});
  }, [healthChecks]);

  // Set up tabs on mount
  useEffect(() => {
    const tabs = Object.entries(TAB_VISIBILITY)
      .filter(([_, isVisible]) => isVisible)
      .map(([key, _]) => ({
        id: key,
        label: key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }));

    setTabs(tabs);
  }, []);

  // Effect to handle landscape initialization and validation
  useEffect(() => {
    // Only run when landscapes are loaded
    if (!apiLandscapes || apiLandscapes.length === 0 || isLoadingApiLandscapes) {
      return;
    }

    const availableLandscapeIds = apiLandscapes.map((l: any) => l.id);
    const isSelectedValid = selectedLandscape && availableLandscapeIds.includes(selectedLandscape);

    // If no landscape selected OR selected landscape is invalid for CIS
    if (!isSelectedValid) {
      // Only update if we haven't already initialized or if the landscape changed externally
      if (!hasInitializedLandscape.current || selectedLandscape !== null) {
        const defaultLandscapeId = getDefaultLandscape(apiLandscapes);
        if (defaultLandscapeId && defaultLandscapeId !== selectedLandscape) {
          setSelectedLandscape(defaultLandscapeId);
          hasInitializedLandscape.current = true;
        }
      }
    } else {
      // Valid landscape is selected
      hasInitializedLandscape.current = true;
    }
  }, [apiLandscapes, selectedLandscape, isLoadingApiLandscapes, setSelectedLandscape, getDefaultLandscape]);

  // Reset initialization flag when component unmounts
  useEffect(() => {
    return () => {
      hasInitializedLandscape.current = false;
    };
  }, []);

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
          activeTab={headerActiveTab || "components"}
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