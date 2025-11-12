import { useState, useMemo, useEffect } from "react";
import cisTimelines from "@/data/cis-timelines.json";
import AskOCTab from "@/components/AskOCTab";
import DeliveryTab from "@/components/DeliveryTab";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import FeatureToggleTab from "@/components/tabs/FeatureToggleTab";
import TimelinesTab from "@/components/tabs/TimelinesTab";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { componentVersions, DEFAULT_LANDSCAPE } from "@/types/developer-portal";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useComponentManagement, useFeatureToggles, useLandscapeManagement, usePortalState } from "@/contexts/hooks";
import { useTabRouting } from "@/hooks/useTabRouting";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { HealthDashboard } from "@/components/Health/HealthDashboard";
import { filterComponentsByLandscape, getLibraryComponents } from "@/utils/componentFiltering";
import AlertsPage from "./AlertsPage";

const TAB_VISIBILITY = {
  components: true,
  health: true,             // Health dashboard
  alerts: true,             // NEW: Alerts management
  'feature-toggle': false,  // Hidden
  delivery: false,          // Hidden
  timelines: false,         // Hidden
  askoc: false             // Hidden
} as const;

export default function CisPage() {
  const [activeTab, setActiveTab] = useState("components");
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");
  const { setTabs, activeTab: headerActiveTab, setActiveTab: setHeaderActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();

  // Get all data from context
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
    getDefaultLandscape,
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
  
  // We need the organization context to make the API call work properly
  const {
    data: cisComponentsData,
    isLoading: cisComponentsLoading,
    error: cisComponentsError,
    refetch: refetchCisComponents
  } = useComponentsByProject('cis20');

  // Fetch landscapes from API for Health Dashboard
  const {
    data: apiLandscapes,
    isLoading: isLoadingApiLandscapes,
  } = useLandscapesByProject('cis20');

  // cisComponentsData is already the components array directly
  const cisApiComponents = cisComponentsData || [];

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
    // If no landscape is selected, show all non-library components
    if (!selectedLandscape) {
      const allNonLibrary = cisApiComponents.filter(c => !c.metadata?.['isLibrary']);
      // Sort alphabetically by name
      return allNonLibrary.sort((a, b) => a.name.localeCompare(b.name));
    }

    const filtered = filterComponentsByLandscape(cisApiComponents, selectedApiLandscape?.metadata);
    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [cisApiComponents, selectedApiLandscape, selectedLandscape]);

  // Get library components separately (always show all libraries)
  const libraryComponents = useMemo(() => {
    const libraries = getLibraryComponents(cisApiComponents);
    // Sort alphabetically by name
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

  // Set up header tabs and sync with URL
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
            {/* Landscape Links Section */}
            <LandscapeLinksSection
              selectedLandscape={selectedLandscape}
              selectedLandscapeData={selectedApiLandscape}
              landscapeGroups={landscapeGroups}
              onLandscapeChange={setSelectedLandscape}
              onShowLandscapeDetails={() => setShowLandscapeDetails(true)}
              hiddenButtons={['plutono']}
            />

            {/* Regular Components Section */}
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
            />

            {/* Library Components Section */}
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
                />
              </div>
            )}
          </>
        );
      case "health":
        return (
          <HealthDashboard
            projectId="cis20"
            components={filteredComponents}
            landscapeGroups={apiLandscapeGroups}
            selectedLandscape={selectedLandscape}
            onLandscapeChange={setSelectedLandscape}
            onShowLandscapeDetails={() => setShowLandscapeDetails(true)}
            isLoadingComponents={cisComponentsLoading || isLoadingApiLandscapes}
          />
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
