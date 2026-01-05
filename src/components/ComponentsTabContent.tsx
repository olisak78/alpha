import { useMemo, ReactNode } from "react";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ComponentsList } from "@/components/ComponentsList";
import { HealthOverview } from "@/components/Health/HealthOverview";
import { Component } from "@/types/api";
import type { ComponentHealthCheck } from "@/types/health";
import { ComponentDisplayProvider } from "@/contexts/ComponentDisplayContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComponentsTabContentProps {
  title: string;
  components: Component[];
  teamName: string;
  isLoading: boolean;
  error: Error | null;
  teamComponentsExpanded: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
  emptyStateMessage?: string;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  system: string;
  showLandscapeFilter?: boolean;
  showComponentMetrics?: boolean;
  selectedLandscape?: string | null;
  selectedLandscapeData?: any;
  teamNamesMap?: Record<string, string>;
  teamColorsMap?: Record<string, string>;
  sortOrder?: 'alphabetic' | 'team';
  onSortOrderChange?: (order: 'alphabetic' | 'team') => void;
  componentHealthMap?: Record<string, ComponentHealthCheck>;
  isLoadingHealth?: boolean;
  viewSwitcher?: ReactNode;
  onComponentClick?: (componentId: string) => void;
  isCentralLandscape?: boolean;
  noCentralLandscapes?: boolean;
  summary?: any;
  isLoadingHealthSummary?: boolean;
  projectId: string;
}

export function ComponentsTabContent({
  title,
  components,
  teamName,
  isLoading,
  error,
  teamComponentsExpanded,
  onToggleExpanded,
  onRefresh,
  showRefreshButton = true,
  showComponentMetrics = true,
  emptyStateMessage,
  searchTerm = "",
  onSearchTermChange,
  system,
  selectedLandscape,
  selectedLandscapeData,
  teamNamesMap = {},
  teamColorsMap = {},
  sortOrder = 'alphabetic',
  onSortOrderChange,
  componentHealthMap = {},
  isLoadingHealth = false,
  viewSwitcher,
  onComponentClick,
  isCentralLandscape = false,
  noCentralLandscapes = false,
  summary,
  isLoadingHealthSummary = false,
  projectId,
}: ComponentsTabContentProps) {
  const { libraryComponents, nonLibraryComponents } = useMemo(() => {
    let filtered = components;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (component) =>
          component.name.toLowerCase().includes(searchLower) ||
          component.title?.toLowerCase().includes(searchLower) ||
          component.description?.toLowerCase().includes(searchLower)
      );
    }

    // Separate library and non-library components
    const libraries: Component[] = [];
    const nonLibraries: Component[] = [];

    filtered.forEach((component) => {
      if (component['is-library']) {
        libraries.push(component);
      } else {
        nonLibraries.push(component);
      }
    });

    // Sort both arrays
    const sortComponents = (componentsArray: Component[]) => {
      return [...componentsArray].sort((a, b) => {
        if (sortOrder === 'team') {
          const teamA = a.owner_id ? teamNamesMap[a.owner_id] || '' : '';
          const teamB = b.owner_id ? teamNamesMap[b.owner_id] || '' : '';
          const teamCompare = teamA.localeCompare(teamB);
          if (teamCompare !== 0) return teamCompare;
        }
        return (a.title || a.name).localeCompare(b.title || b.name);
      });
    };

    return {
      libraryComponents: sortComponents(libraries),
      nonLibraryComponents: sortComponents(nonLibraries),
    };
  }, [components, searchTerm, sortOrder, teamNamesMap]);

  if (isLoading) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center bg-white dark:bg-[#0D0D0D]">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading components...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading components: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      {onSearchTermChange && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          {onSortOrderChange && (
            <Select value={sortOrder} onValueChange={onSortOrderChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetic">Alphabetic</SelectItem>
                <SelectItem value="team">By Team</SelectItem>
              </SelectContent>
            </Select>
          )}
          {showRefreshButton && onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <HealthOverview summary={summary} isLoading={isLoadingHealthSummary} />
        </div>
      )}

      {/* Components Content */}
      {libraryComponents.length === 0 && nonLibraryComponents.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center bg-white dark:bg-[#0D0D0D]">
          <p className="text-gray-500 dark:text-gray-400">
            {emptyStateMessage || "No components found"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ComponentDisplayProvider
            projectId={projectId}
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedLandscapeData}
            isCentralLandscape={isCentralLandscape}
            noCentralLandscapes={noCentralLandscapes}
            teamNamesMap={teamNamesMap}
            teamColorsMap={teamColorsMap}
            componentHealthMap={componentHealthMap}
            isLoadingHealth={isLoadingHealth}
            expandedComponents={teamComponentsExpanded}
            onToggleExpanded={onToggleExpanded}
            system={system}
            components={[...nonLibraryComponents, ...libraryComponents]}
          >
            {/* Non-Library Components Section */}
            {nonLibraryComponents.length > 0 && (
              <div>
                <ComponentsList
                  components={nonLibraryComponents}
                  showProjectGrouping={false}
                  onComponentClick={onComponentClick}
                />
              </div>
            )}

            {/* Library Components Section */}
            {libraryComponents.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">
                  Library Components
                </h2>
                <ComponentsList
                  components={libraryComponents}
                  showProjectGrouping={false}
                  onComponentClick={onComponentClick}
                />
              </div>
            )}
          </ComponentDisplayProvider>
        </div>
      )}
    </div>
  );
}
