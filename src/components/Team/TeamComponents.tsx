import ComponentCard from "@/components/ComponentCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Component } from "@/types/api";
import type { ComponentHealthCheck } from "@/types/health";
import { GithubIcon } from "../icons/GithubIcon";

interface TeamComponentsProps {
  components: Component[];
  teamName: string;
  teamComponentsExpanded: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  system: string;
  showProjectGrouping?: boolean;
  selectedLandscape?: string | null;
  selectedLandscapeData?: any;
  compactView?: boolean;
  teamNamesMap?: Record<string, string>;
  teamColorsMap?: Record<string, string>;
  componentHealthMap?: Record<string, ComponentHealthCheck>;
  isLoadingHealth?: boolean;
  onComponentClick?: (componentId: string) => void;
}

export function TeamComponents({
  components,
  teamName,
  teamComponentsExpanded,
  onToggleExpanded,
  system,
  showProjectGrouping = false,
  selectedLandscape,
  selectedLandscapeData,
  compactView = false,
  teamNamesMap = {},
  teamColorsMap = {},
  componentHealthMap = {},
  isLoadingHealth = false,
  onComponentClick,

}: TeamComponentsProps) {
  if (!components || components.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No components found for this team.
      </div>
    );
  }

  const openLink = (url: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Helper function to render a compact component item (for team pages)
  const renderCompactComponentItem = (component: Component) => {
    const ownerTeamName = component.owner_id ? teamNamesMap[component.owner_id] : undefined;
    const ownerTeamColor = component.owner_id ? teamColorsMap[component.owner_id] : undefined;

    return (
      <div
        key={component.id}
        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{component.title || component.name}</h4>
              {ownerTeamName && (
                <Badge
                  variant="secondary"
                  className="text-xs flex-shrink-0 text-white border-0"
                  style={{ backgroundColor: ownerTeamColor || '#6b7280' }}
                >
                  {ownerTeamName}
                </Badge>
              )}
            </div>
            {component.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {component.description}
              </p>
            )}
          </div>
          {component.github && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openLink(component.github!)}
              className="flex-shrink-0"
            >
              <GithubIcon className="h-3.5 w-3.5 mr-1.5" />
              GitHub
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render a component card (for project pages)
  const renderComponentCard = (component: Component) => {
    const ownerTeamName = component.owner_id ? teamNamesMap[component.owner_id] : undefined;
    const ownerTeamColor = component.owner_id ? teamColorsMap[component.owner_id] : undefined;

    return (
      <ComponentCard
        key={component.id}
        component={{
          id: component.id,
          name: component.name,
          title: component.title,
          description: component.description || `Owned by ${teamName} • Component ID: ${component.id}`,
          project_id: component.project_id,
          owner_id: component.owner_id,
          github: component.github,
          sonar: component.sonar,
          qos: component.qos,
          project_title: component.project_title,
          metadata: component.metadata
        }}
        system={system}
        selectedLandscape={selectedLandscape}
        selectedLandscapeName={undefined}
        selectedLandscapeData={selectedLandscapeData}
        expandedComponents={teamComponentsExpanded}
        onToggleExpanded={onToggleExpanded}
        getComponentHealth={() => "N/A"}
        getComponentAlerts={() => null}
        teamName={ownerTeamName}
        teamColor={ownerTeamColor}
        healthCheck={componentHealthMap[component.id]}
        isLoadingHealth={isLoadingHealth}
        onClick={onComponentClick ? () => onComponentClick(component.name) : undefined}

      />
    );
  };

  // Use compact view for team pages
  if (compactView) {
    // Group components by project_title when project grouping is enabled
    if (showProjectGrouping) {
      const groupedComponents = components.reduce((groups, component) => {
        const projectTitle = component.project_title || '';
        if (!groups[projectTitle]) {
          groups[projectTitle] = [];
        }
        groups[projectTitle].push(component);
        return groups;
      }, {} as Record<string, Component[]>);

      const sortedProjectTitles = Object.keys(groupedComponents).sort();

      return (
        <div className="space-y-8">
          {sortedProjectTitles.map((projectTitle) => (
            <div key={projectTitle} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {projectTitle}
                </h3>
                {projectTitle && (
                  <Badge variant="secondary" className="text-xs">
                    {groupedComponents[projectTitle].length}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedComponents[projectTitle].map(renderCompactComponentItem)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Simple list for compact view without grouping
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {components.map(renderCompactComponentItem)}
      </div>
    );
  }

  // Use full component cards for project pages
  if (!showProjectGrouping) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map(renderComponentCard)}
      </div>
    );
  }

  // Group components by project_title when project grouping is enabled
  const groupedComponents = components.reduce((groups, component) => {
    const projectTitle = component.project_title || '';
    if (!groups[projectTitle]) {
      groups[projectTitle] = [];
    }
    groups[projectTitle].push(component);
    return groups;
  }, {} as Record<string, Component[]>);

  const sortedProjectTitles = Object.keys(groupedComponents).sort();

  return (
    <div className="space-y-8">
      {sortedProjectTitles.map((projectTitle) => (
        <div key={projectTitle} className="space-y-4">
          <div className="border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {projectTitle}
              </h3>
              {projectTitle && <Badge variant="secondary">
                {groupedComponents[projectTitle].length}
              </Badge>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedComponents[projectTitle].map(renderComponentCard)}
          </div>
        </div>
      ))}
    </div>
  );
}