import { useState, useMemo } from "react";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TeamComponents } from "@/components/Team/TeamComponents";
import { Component } from "@/types/api";
// NEW: Import health check type
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
  // NEW: Health status props
  componentHealthMap?: Record<string, ComponentHealthCheck>;
  isLoadingHealth?: boolean;
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
  // NEW: Health status props with default values
  componentHealthMap = {},
  isLoadingHealth = false,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{title}</CardTitle>
            <div className="flex items-center gap-3">
              {onSortOrderChange && (
                <Select value={sortOrder} onValueChange={(value: 'alphabetic' | 'team') => onSortOrderChange(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetic">Alphabetic</SelectItem>
                    <SelectItem value="team">By Team</SelectItem>
                  </SelectContent>
                </Select>
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {onSearchTermChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading {teamName} components...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load {teamName} components: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (
          <TeamComponents
            components={filteredAndSortedComponents}
            teamName={teamName}
            teamComponentsExpanded={teamComponentsExpanded}
            onToggleExpanded={onToggleExpanded}
            system={system}
            showProjectGrouping={false}
            selectedLandscape={selectedLandscape}
            selectedLandscapeData={selectedLandscapeData}
            teamNamesMap={teamNamesMap}
            teamColorsMap={teamColorsMap}
            // NEW: Pass health status map to TeamComponents
            componentHealthMap={componentHealthMap}
            isLoadingHealth={isLoadingHealth}
          />
        )}
      </div>
    </div>
  );
}