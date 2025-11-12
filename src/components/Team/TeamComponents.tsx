import ComponentCard from "@/components/ComponentCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import type { Component } from "@/types/api";

interface TeamComponentsProps {
  components: Component[];
  teamName: string;
  teamComponentsExpanded: Record<string, boolean>;
  onToggleExpanded: (componentId: string) => void;
  system: string;
  showProjectGrouping?: boolean; // New prop to control project grouping
  selectedLandscape?: string | null;
  selectedLandscapeData?: any; // Landscape data with metadata
  compactView?: boolean; // New prop to use compact view for team pages
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
    return (
      <div
        key={component.id}
        className="group relative flex items-center justify-between px-4 py-3 rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
      >
        {/* Left side - Component name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary/80 to-primary/40 group-hover:from-primary group-hover:to-primary/60 transition-all" />
          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {component.title || component.name}
          </span>
        </div>

        {/* Right side - GitHub link */}
        {component.github && component.github.trim() !== '' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs opacity-60 group-hover:opacity-100 transition-opacity"
            onClick={() => openLink(component.github!)}
          >
            <Github className="h-3.5 w-3.5 mr-1.5" />
            GitHub
          </Button>
        )}
      </div>
    );
  };

  // Helper function to render a component card (for project pages)
  const renderComponentCard = (component: Component) => {
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
