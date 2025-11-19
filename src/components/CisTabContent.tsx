import { LandscapeLinksSection } from "@/components/LandscapeLinksSection";
import { ComponentsTabContent } from "@/components/ComponentsTabContent";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { HealthOverview, HealthTable } from "@/components/Health";
import AlertsPage from "@/pages/AlertsPage";
import FeatureToggleTab from "@/components/tabs/FeatureToggleTab";
import DeliveryTab from "@/components/DeliveryTab";
import TimelinesTab from "@/components/tabs/TimelinesTab";
import AskOCTab from "@/components/AskOCTab";
import type { ComponentHealthCheck, HealthSummary } from "@/types/health";
import type { Landscape } from "@/types/developer-portal";
import { useMemo } from "react";
import { Badge } from "./ui/badge";


interface LandscapeGroup {
  id: string;
  name: string;
  landscapes: Array<{
    id: string;
    name: string;
    isCentral: boolean;
  }>;
}

interface CisTabContentProps {
  // Active tab
  activeTab: string;

  // Component view
  componentView: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;

  // Landscape data
  selectedLandscape: string | null;
  selectedApiLandscape: any;
  landscapeGroups: LandscapeGroup[];
  currentProjectLandscapes: any[];
  onLandscapeChange: (landscapeId: string | null) => void;
  onShowLandscapeDetails: () => void;

  // Components data
  filteredComponents: any[];
  libraryComponents: any[];
  cisComponentsLoading: boolean;
  cisComponentsError: any;
  teamComponentsExpanded: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  refetchCisComponents: () => void;
  componentSearchTerm: string;
  onSearchTermChange: (term: string) => void;
  componentSortOrder: 'alphabetic' | 'team';
  onSortOrderChange: (order: 'alphabetic' | 'team') => void;
  onComponentClick: (componentName: string) => void;

  // Health data
  healthChecks: ComponentHealthCheck[];
  isLoadingHealth: boolean;
  summary: HealthSummary;
  componentHealthMap: Record<string, ComponentHealthCheck>;

  // Team data
  teamNamesMap: Record<string, string>;
  teamColorsMap: Record<string, string>;

  // Feature toggle data - matching FeatureToggleTab interface
  filteredToggles: any[];
  expandedToggles: Set<string>;
  toggleFilter: "all" | "all-enabled" | "all-disabled" | "mixed";
  componentFilter: string;
  availableComponents: string[];
  activeProject: string;
  onToggleFeature: (toggleId: string, landscape: string) => void;
  onToggleExpandedFeature: (toggleId: string) => void;
  onBulkToggle: (toggleId: string, group: string, enable: boolean, landscapeGroups: Record<string, Landscape[]>) => void;
  onToggleFilterChange: (filter: "all" | "all-enabled" | "all-disabled" | "mixed") => void;
  onComponentFilterChange: (filter: string) => void;
  getFilteredLandscapeIds: (activeProject: string, selectedLandscape: string | null) => string[];
  getProductionLandscapeIds: (activeProject: string) => string[];
  getGroupStatus: (toggle: any, group: string, landscapeGroups: Record<string, Landscape[]>) => { status: string; color: string };

  // Timeline data
  cisTimelines: any[];
  componentVersions: any;
  timelineViewMode: 'table' | 'chart';
  onTimelineViewModeChange: (mode: 'table' | 'chart') => void;
}

export function CisTabContent({
  activeTab,
  componentView,
  onViewChange,
  selectedLandscape,
  selectedApiLandscape,
  landscapeGroups,
  currentProjectLandscapes,
  onLandscapeChange,
  onShowLandscapeDetails,
  filteredComponents,
  cisComponentsLoading,
  cisComponentsError,
  teamComponentsExpanded,
  onToggleExpanded,
  refetchCisComponents,
  componentSearchTerm,
  onSearchTermChange,
  componentSortOrder,
  onSortOrderChange,
  onComponentClick,
  healthChecks,
  isLoadingHealth,
  summary,
  componentHealthMap,
  teamNamesMap,
  teamColorsMap,
  filteredToggles,
  expandedToggles,
  toggleFilter,
  componentFilter,
  availableComponents,
  activeProject,
  onToggleFeature,
  onToggleExpandedFeature,
  onBulkToggle,
  onToggleFilterChange,
  onComponentFilterChange,
  getFilteredLandscapeIds,
  getProductionLandscapeIds,
  getGroupStatus,
  cisTimelines,
  componentVersions,
  timelineViewMode,
  onTimelineViewModeChange,
}: CisTabContentProps) {
  // Convert LandscapeGroup[] back to Record<string, Landscape[]> for Feature Toggle tab
  const landscapeGroupsRecord = useMemo(() => {
    return landscapeGroups.reduce((acc, group) => {
      acc[group.name] = group.landscapes.map(l => ({
        id: l.id,
        name: l.name,
        isCentral: l.isCentral
      })) as Landscape[];
      return acc;
    }, {} as Record<string, Landscape[]>);
  }, [landscapeGroups]);

  switch (activeTab) {
    case "components":
      return (
        <>
          <LandscapeLinksSection
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedApiLandscape}
            landscapeGroups={landscapeGroups}
            onLandscapeChange={onLandscapeChange}
            onShowLandscapeDetails={onShowLandscapeDetails}
          />
          {componentView === 'grid' ? (
            <>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Components</h2>
                    {selectedLandscape && filteredComponents.length > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {filteredComponents.length}
                      </Badge>
                    )}
                  </div>
                  <ViewSwitcher view={componentView} onViewChange={onViewChange} />
                </div>

                {selectedLandscape && filteredComponents.length > 0 ? (
                  <>
                    <HealthOverview summary={summary} isLoading={isLoadingHealth} />
                    <ComponentsTabContent
                      title=""
                      components={filteredComponents}
                      teamName="CIS"
                      isLoading={cisComponentsLoading}
                      error={cisComponentsError}
                      teamComponentsExpanded={teamComponentsExpanded}
                      onToggleExpanded={onToggleExpanded}
                      onRefresh={refetchCisComponents}
                      showRefreshButton={false}
                      emptyStateMessage="No components found."
                      searchTerm={componentSearchTerm}
                      onSearchTermChange={onSearchTermChange}
                      system="cis"
                      showLandscapeFilter={false}
                      selectedLandscape={selectedLandscape}
                      selectedLandscapeData={selectedApiLandscape}
                      teamNamesMap={teamNamesMap}
                      teamColorsMap={teamColorsMap}
                      sortOrder={componentSortOrder}
                      onSortOrderChange={onSortOrderChange}
                      componentHealthMap={componentHealthMap}
                      isLoadingHealth={isLoadingHealth}
                      onComponentClick={onComponentClick}
                    />
                  </>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <p className="text-muted-foreground">
                      {!selectedLandscape
                        ? 'Select a landscape to view components and their health status'
                        : 'No components found in this landscape'}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Components</h2>
                    {selectedLandscape && filteredComponents.length > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {filteredComponents.length}
                      </Badge>
                    )}
                  </div>
                <ViewSwitcher view={componentView} onViewChange={onViewChange} />
              </div>

              {selectedLandscape && filteredComponents.length > 0 ? (
                <>
                  <HealthOverview summary={summary} isLoading={isLoadingHealth} />
                  <HealthTable
                    healthChecks={healthChecks}
                    isLoading={isLoadingHealth}
                    landscape={selectedApiLandscape?.name || ''}
                    teamNamesMap={teamNamesMap}
                    onComponentClick={onComponentClick}
                    components={filteredComponents}
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
          landscapeGroups={landscapeGroupsRecord}
          expandedToggles={expandedToggles}
          toggleFilter={toggleFilter}
          componentFilter={componentFilter}
          availableComponents={availableComponents}
          activeProject={activeProject}
          onToggleFeature={onToggleFeature}
          onToggleExpanded={onToggleExpandedFeature}
          onBulkToggle={onBulkToggle}
          onToggleFilterChange={onToggleFilterChange}
          onComponentFilterChange={onComponentFilterChange}
          getFilteredLandscapeIds={getFilteredLandscapeIds}
          getProductionLandscapeIds={getProductionLandscapeIds}
          getGroupStatus={getGroupStatus}
        />
      );
    case "delivery":
      return <DeliveryTab selectedLandscape={selectedLandscape} landscapes={currentProjectLandscapes} />;
    case "timelines":
      return (
        <TimelinesTab
          selectedLandscape={selectedLandscape}
          cisTimelines={cisTimelines}
          componentVersions={componentVersions}
          timelineViewMode={timelineViewMode}
          onTimelineViewModeChange={onTimelineViewModeChange}
        />
      );
    case "askoc":
      return <AskOCTab />;
    default:
      return null;
  }
}