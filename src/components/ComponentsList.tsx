import ComponentCard from "@/components/ComponentCard";
import { Badge } from "@/components/ui/badge";
import type { Component } from "@/types/api";
import { ComponentItem } from "@/components/ComponentItem";

interface ComponentsListProps {
  components: Component[];
  showProjectGrouping?: boolean;
  compactView?: boolean;
  onComponentClick?: (componentId: string) => void;
}

export function ComponentsList({
  components,
  showProjectGrouping = false,
  compactView = false,
  onComponentClick,
}: ComponentsListProps) {
  
  const sortByPinnedStatus = (a: Component, b: Component) => {
    // Pinned components come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  };
  
  // Sort components to show pinned ones first
  const sortedComponents = [...components].sort(sortByPinnedStatus);
  
  if (!components || components.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No components found for this team.
      </div>
    );
  }

  // Helper function to render a compact component item (for team pages)
  const renderCompactComponentItem = (component: Component) => {
    return (
      <ComponentItem
        key={component.id}
        component={component}
        onComponentClick={onComponentClick}
      />
    );
  };

  // Helper function to render a component card (for project pages)
  const renderComponentCard = (component: Component) => {
    return (
      <ComponentCard
        key={component.id}
        component={component}
        onClick={onComponentClick ? () => {
          onComponentClick(component.name);
        } : undefined}
      />
    );
  };

  // Use compact view for team pages
  if (compactView) {
    // Group components by project_title when project grouping is enabled
    if (showProjectGrouping) {
      const groupedComponents = sortedComponents.reduce((groups, component) => {
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
                {groupedComponents[projectTitle]
                  .sort(sortByPinnedStatus)
                  .map(renderCompactComponentItem)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Simple list for compact view without grouping
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedComponents.map(renderCompactComponentItem)}
      </div>
    );
  }

  // Use full component cards for project pages
  if (!showProjectGrouping) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedComponents.map(renderComponentCard)}
      </div>
    );
  }

  // Group components by project_title when project grouping is enabled
  const groupedComponents = sortedComponents.reduce((groups, component) => {
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
            {groupedComponents[projectTitle]
              .sort(sortByPinnedStatus)
              .map(renderComponentCard)}
          </div>
        </div>
      ))}
    </div>
  );
}
