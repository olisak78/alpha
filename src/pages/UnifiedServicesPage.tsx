import { useState, useMemo, useEffect } from "react";
import DeskPage from "@/components/DeskPage";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import FeatureToggleTab from "@/components/tabs/FeatureToggleTab";
import {
  usePortalState,
  useLandscapeManagement,
  useComponentManagement,
  useFeatureToggles
} from "@/contexts/hooks";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import { useTabRouting } from "@/hooks/useTabRouting";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { DEFAULT_LANDSCAPE } from "@/types/developer-portal";

const TAB_VISIBILITY = {
  components: true,
  'feature-toggle': false,
  desk: false
} as const;

export default function UnifiedServicesPage() {
  const [activeTab, setActiveTab] = useState("components");
  const { setTabs, activeTab: headerActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");

  const activeProject = "Unified Services"; // This page is specifically for Unified Services

  const { selectedLandscape, setSelectedLandscape, setShowLandscapeDetails } = usePortalState();
  const { getCurrentProjectLandscapes, getLandscapeGroups, getFilteredLandscapeIds, getProductionLandscapeIds,getDefaultLandscape } = useLandscapeManagement();
  const { componentFilter, setComponentFilter, getAvailableComponents } = useComponentManagement();
  const { featureToggles, expandedToggles, toggleFilter, setToggleFilter, toggleFeature, toggleExpanded, bulkToggle, getGroupStatus, getFilteredToggles } = useFeatureToggles();

  // Fetch API components filtered by project name "usrv"
  const {
    data: unifiedServicesComponentsData,
    isLoading: unifiedServicesComponentsLoading,
    error: unifiedServicesComponentsError,
    refetch: refetchUnifiedServicesComponents
  } = useComponentsByProject('usrv');

  // Fetch landscapes from API
  const {
    data: apiLandscapes,
  } = useLandscapesByProject('usrv');

  // Extract components from the API response and create proper ownership/nameById mappings
  const unifiedServicesApiComponents = useMemo(() => {
    if (!unifiedServicesComponentsData) return [];
    return unifiedServicesComponentsData;
  }, [unifiedServicesComponentsData]);

  // Find the selected landscape from API data
  const selectedApiLandscape = useMemo(() => {
    return apiLandscapes?.find((l: any) => l.id === selectedLandscape);
  }, [apiLandscapes, selectedLandscape]);

  // Get project-specific data
  const landscapeGroups = getLandscapeGroups(activeProject);
  const filteredToggles = getFilteredToggles(activeProject, selectedLandscape, componentFilter, toggleFilter);
  const availableComponents = getAvailableComponents(activeProject, featureToggles);

  // Memoize header tabs
  const headerTabs = useMemo(() => [
    { id: "components", label: "Components" },
    { id: "feature-toggle", label: "Feature Toggle" },
    { id: "desk", label: "USRV Console" }
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

  useEffect(() => {
    const landscapes = getCurrentProjectLandscapes(activeProject);
    if (landscapes.length > 0 && !selectedLandscape) {
      const defaultLandscapeId = getDefaultLandscape(activeProject);
      if (defaultLandscapeId) {
        setSelectedLandscape(defaultLandscapeId);
      }
    }
  }, [activeProject, selectedLandscape, setSelectedLandscape, getCurrentProjectLandscapes, getDefaultLandscape]);

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
              hiddenButtons={['concourse', 'dynatrace', 'cockpit']}
            />

            {/* Components Section */}
            <ComponentsTabContent
              title="Unified Services Components"
              components={unifiedServicesApiComponents}
              teamName="Unified Services"
              isLoading={unifiedServicesComponentsLoading}
              error={unifiedServicesComponentsError}
              teamComponentsExpanded={teamComponentsExpanded}
              onToggleExpanded={handleToggleComponentExpansion}
              onRefresh={refetchUnifiedServicesComponents}
              showRefreshButton={false}
              emptyStateMessage="No Unified Services components found for this organization."
              searchTerm={componentSearchTerm}
              onSearchTermChange={setComponentSearchTerm}
              system="services"
            />
          </>
        );
      case "feature-toggle":
        return (
          <FeatureToggleTab
            featureToggles={filteredToggles}
            selectedLandscape={selectedLandscape}
            selectedLandscapeName={getCurrentProjectLandscapes(activeProject).find(l => l.id === selectedLandscape)?.name}
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
      case "desk":
        return <DeskPage />;
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
