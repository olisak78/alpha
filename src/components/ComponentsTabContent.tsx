import { useMemo, ReactNode } from "react";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TeamComponents } from "@/components/Team/TeamComponents";
import { Component } from "@/types/api";
import type { ComponentHealthCheck } from "@/types/health";
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
  selectedLandscape?: string | null;
  selectedLandscapeData?: any;
  teamNamesMap?: Record<string, string>;
  teamColorsMap?: Record<string, string>;
  sortOrder?: 'alphabetic' | 'team';
  onSortOrderChange?: (order: 'alphabetic' | 'team') => void;
  componentHealthMap?: Record<string, ComponentHealthCheck>;
  isLoadingHealth?: boolean;
  viewSwitcher?: ReactNode;
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
}: ComponentsTabContentProps) {
  const filteredAndSortedComponents = useMemo(() => {
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

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === 'team') {
        const teamA = a.owner_id ? teamNamesMap[a.owner_id] || '' : '';
        const teamB = b.owner_id ? teamNamesMap[b.owner_id] || '' : '';
        const teamCompare = teamA.localeCompare(teamB);
        if (teamCompare !== 0) return teamCompare;
      }
      return (a.title || a.name).localeCompare(b.title || b.name);
    });

    return sorted;
  }, [components, searchTerm, sortOrder, teamNamesMap]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading components...</span>
          </div>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAndSortedComponents.length} component{filteredAndSortedComponents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {viewSwitcher}
            {showRefreshButton && onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          </div>
        )}

        {filteredAndSortedComponents.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {emptyStateMessage || "No components found"}
            </p>
          </div>
        ) : (
          <TeamComponents
            teamName={teamName}
            components={filteredAndSortedComponents}
            teamComponentsExpanded={teamComponentsExpanded}
            onToggleExpanded={onToggleExpanded}
            system={system}
            showProjectGrouping={false}
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedLandscapeData}
            teamNamesMap={teamNamesMap}
            teamColorsMap={teamColorsMap}
            componentHealthMap={componentHealthMap}
            isLoadingHealth={isLoadingHealth}
          />
        )}
      </CardContent>
    </Card>
  );
}