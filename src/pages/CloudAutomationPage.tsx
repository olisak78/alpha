import { useState, useMemo, useEffect } from "react";
import { LandscapeFilter } from "@/components/LandscapeFilter";
import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import FeatureToggleTab from "@/components/tabs/FeatureToggleTab";
import { BreadcrumbPage } from "@/components/BreadcrumbPage";
import { useHeaderNavigation } from "@/contexts/HeaderNavigationContext";
import {
  usePortalState,
  useLandscapeManagement,
  useComponentManagement,
  useFeatureToggles
} from "@/contexts/hooks";
import { useTabRouting } from "@/hooks/useTabRouting";
import { useComponentsByProject } from "@/hooks/api/useComponents";
import { useLandscapesByProject } from "@/hooks/api/useLandscapes";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { useAuthRefresh } from "@/hooks/useAuthRefresh";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_LANDSCAPE } from "@/types/developer-portal";

const TAB_VISIBILITY = {
  components: true,
  'feature-toggle': false,  // Hidden
} as const;

export default function CloudAutomationPage() {
  const [activeTab, setActiveTab] = useState("components");
  const { setTabs, activeTab: headerActiveTab } = useHeaderNavigation();
  const { currentTabFromUrl, syncTabWithUrl } = useTabRouting();
  const [teamComponentsExpanded, setTeamComponentsExpanded] = useState<Record<string, boolean>>({});
  const [componentSearchTerm, setComponentSearchTerm] = useState("");

  // Check authentication status on mount
  const { isAuthenticated, authError, retry } = useAuthRefresh();

  const { selectedLandscape, setSelectedLandscape, setShowLandscapeDetails } = usePortalState();
  const { getCurrentProjectLandscapes, getLandscapeGroups, getFilteredLandscapeIds, getProductionLandscapeIds, getDefaultLandscape } = useLandscapeManagement();
  const { componentFilter, setComponentFilter, getAvailableComponents } = useComponentManagement();
  const { featureToggles, expandedToggles, toggleFilter, setToggleFilter, toggleFeature, toggleExpanded, bulkToggle, getGroupStatus, getFilteredToggles } = useFeatureToggles();

  const activeProject = "Cloud Automation";
  
  // Get current user's organization ID first (like the original hooks)
  const { user } = useAuth();

  // Fetch API components filtered by project name "ca"
  const {
    data: cloudAutomationComponentsData,
    isLoading: cloudAutomationComponentsLoading,
    error: cloudAutomationComponentsError,
    refetch: refetchCloudAutomationComponents
  } = useComponentsByProject('ca');

  // Fetch landscapes from API
  const {
    data: apiLandscapes,
  } = useLandscapesByProject('ca');

  // Extract components from the API response and create proper ownership/nameById mappings
  const cloudAutomationApiComponents = useMemo(() => {
    if (!cloudAutomationComponentsData) return [];
    return cloudAutomationComponentsData;
  }, [cloudAutomationComponentsData]);

  // Find the selected landscape from API data
  const selectedApiLandscape = useMemo(() => {
    return apiLandscapes?.find((l: any) => l.id === selectedLandscape);
  }, [apiLandscapes, selectedLandscape]);


  // Get data from context functions
  const currentProjectLandscapes = getCurrentProjectLandscapes(activeProject);
  const landscapeGroups = getLandscapeGroups(activeProject);
  const availableComponents = getAvailableComponents(activeProject, featureToggles);
  const filteredToggles = getFilteredToggles(activeProject, selectedLandscape, componentFilter, toggleFilter);

  // Memoize header tabs
  const headerTabs = useMemo(() => [
    { id: "components", label: "Components" },
    { id: "feature-toggle", label: "Feature Toggle" }
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
              hiddenButtons={['concourse', 'plutono', 'cockpit']}
            />

            {/* Components Section */}
            <ComponentsTabContent
              title="Cloud Automation Components"
              components={cloudAutomationApiComponents}
              teamName="Cloud Automation"
              isLoading={cloudAutomationComponentsLoading}
              error={cloudAutomationComponentsError}
              teamComponentsExpanded={teamComponentsExpanded}
              onToggleExpanded={handleToggleComponentExpansion}
              onRefresh={refetchCloudAutomationComponents}
              showRefreshButton={false}
              emptyStateMessage="No Cloud Automation components found for this organization."
              searchTerm={componentSearchTerm}
              onSearchTermChange={setComponentSearchTerm}
              system="cloud-automation"
            />
          </>
        );
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
