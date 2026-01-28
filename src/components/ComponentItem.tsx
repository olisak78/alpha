import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Component } from "@/types/api";
import { GithubIcon } from "./icons/GithubIcon";
// useComponentOwner not needed - team context makes team badges redundant

interface ComponentItemProps {
  component: Component;
  onComponentClick?: (componentName: string) => void;
}

export function ComponentItem({ component, onComponentClick }: ComponentItemProps) {

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger navigation if clicking on buttons
    const target = e.target as HTMLElement;
    if (!target.closest('button') && onComponentClick) {
      onComponentClick(component.name);
    }
  };

  const openLink = (url: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      key={component.id}
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{component.title || component.name}</h4>
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
}
