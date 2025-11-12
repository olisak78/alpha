import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamComponents } from "@/components/Team/TeamComponents";
import { ComponentsSearchFilter } from "@/components/ComponentsSearchFilter";
import type { ComponentListResponse } from "@/types/api";
import { useMemo } from "react";

interface ComponentsTabContentProps {
  title: string;
  components: ComponentListResponse;
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
  additionalControls?: React.ReactNode;
  showLandscapeFilter?: boolean;
  selectedLandscape?: string | null;
  selectedLandscapeData?: any;
}

/**
 * Reusable Components Tab Content
 * 
 * This component displays a list of components with loading, error, and empty states.
 * Used across CisPage, CloudAutomationPage, and UnifiedServicesPage.
 */
export function ComponentsTabContent({
  title,
  components,
  teamName,
  isLoading,
  error,
  teamComponentsExpanded,
  onToggleExpanded,
  onRefresh,
  showRefreshButton = false,
  emptyStateMessage,
  searchTerm = "",
  onSearchTermChange,
  system,
  additionalControls,
  showLandscapeFilter = false,
  selectedLandscape,
  selectedLandscapeData
}: ComponentsTabContentProps) {
  // Filter components based on search term
  const filteredComponents = useMemo(() => {
    if (!searchTerm.trim()) return components;
    
    const searchLower = searchTerm.toLowerCase();
    return components.filter(component => {
      const displayName = 'display_name' in component ? component.display_name : ('title' in component ? component.title : '');
      return (
        component.name.toLowerCase().includes(searchLower) ||
        displayName?.toString().toLowerCase().includes(searchLower) ||
        component.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [components, searchTerm]);

  return (
    <div>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="border-b border-border pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left side - Title and count */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                {filteredComponents.length}
              </Badge>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-2">
              {/* Search Filter */}
              {!isLoading && !error && onSearchTermChange && (
                <ComponentsSearchFilter
                  searchTerm={searchTerm}
                  setSearchTerm={onSearchTermChange}
                />
              )}
              {/* Additional controls */}
              {additionalControls && (
                <div className="flex-shrink-0">
                  {additionalControls}
                </div>
              )}
              {showRefreshButton && onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading {teamName} components...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load {teamName} components: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Components Display using TeamComponents */}
        {!isLoading && !error && (
          <TeamComponents
            components={filteredComponents}
            teamName={teamName}
            teamComponentsExpanded={teamComponentsExpanded}
            onToggleExpanded={onToggleExpanded}
            system={system}
            showProjectGrouping={false} // Project-specific pages don't show grouping
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedLandscapeData}
          />
        )}
      </div>
    </div>
  );
}
