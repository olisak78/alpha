import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Component } from "@/types/api";
import { GithubIcon } from "../icons/GithubIcon";

interface ActionButtonsProps {
  component: Component;
  onStopPropagation?: (e: React.MouseEvent) => void;
}

export function ActionButtons({ component, onStopPropagation }: ActionButtonsProps) {
  const openLink = (url: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleButtonClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (onStopPropagation) {
      onStopPropagation(e);
    }
    openLink(url);
  };

  return (
    <div className="flex gap-2 justify-end pb-6">
      {component.github && component.github.trim() !== '' && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs pointer-events-auto"
          onClick={(e) => handleButtonClick(e, component.github!)}
        >
          <GithubIcon className="h-3 w-3 mr-1" />
          GitHub
        </Button>
      )}
      {component.sonar && component.sonar.trim() !== '' && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs pointer-events-auto"
          onClick={(e) => handleButtonClick(e, component.sonar!)}
        >
          <Activity className="h-3 w-3 mr-1" />
          Sonar
        </Button>
      )}
    </div>
  );
}
