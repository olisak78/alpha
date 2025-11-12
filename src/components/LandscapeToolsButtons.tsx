import { Button } from "@/components/ui/button";
import { useLandscapeTools } from "@/hooks/useLandscapeTools";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ConcourseIcon } from "@/components/icons/ConcourseIcon";
import { KibanaIcon } from "@/components/icons/KibanaIcon";
import { DynatraceIcon } from "@/components/icons/DynatraceIcon";
import { PlutonoIcon } from "@/components/icons/PlutonoIcon";
import { Plane } from "lucide-react";

export type ToolButton = 'git' | 'concourse' | 'kibana' | 'dynatrace' | 'plutono' | 'cockpit';

interface LandscapeToolsButtonsProps {
  selectedLandscape: string | null;
  landscapeData?: any;
  hiddenButtons?: ToolButton[];
}

export function LandscapeToolsButtons({ selectedLandscape, landscapeData, hiddenButtons = [] }: LandscapeToolsButtonsProps) {
  const { urls, availability } = useLandscapeTools(selectedLandscape, landscapeData);

  const handleToolClick = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if no landscape is selected
  if (!selectedLandscape) {
    return null;
  }

  const isHidden = (button: ToolButton) => hiddenButtons.includes(button);

  return (
    <div className="flex items-center gap-2">
      {!isHidden('git') && (
        <Button
          variant="outline"
          size="sm"
          disabled={!availability.git}
          onClick={() => handleToolClick(urls.git)}
          className="flex items-center gap-2"
        >
          <GithubIcon className="h-4 w-4" />
          <span className="font-medium">Git</span>
        </Button>
      )}

      {!isHidden('concourse') && (
        <Button
          variant="outline"
          size="sm"
          disabled={!availability.concourse}
          onClick={() => handleToolClick(urls.concourse)}
          className="flex items-center gap-2"
        >
          <ConcourseIcon className="h-4 w-4" />
          <span className="font-medium">Concourse</span>
        </Button>
      )}

      {!isHidden('kibana') && (
        <Button
          variant="outline"
          size="sm"
          disabled={!availability.kibana}
          onClick={() => handleToolClick(urls.kibana)}
          className="flex items-center gap-2"
        >
          <KibanaIcon className="h-4 w-4" />
          <span className="font-medium">Kibana</span>
        </Button>
      )}

      {!isHidden('dynatrace') && (
        <Button
          variant="outline"
          size="sm"
          disabled={!availability.dynatrace}
          onClick={() => handleToolClick(urls.dynatrace)}
          className="flex items-center gap-2"
        >
          <DynatraceIcon className="h-4 w-4" />
          <span className="font-medium">Dynatrace</span>
        </Button>
      )}

      {!isHidden('cockpit') && (
        <Button
          variant="outline"
          size="sm"
          disabled={!availability.cockpit}
          onClick={() => handleToolClick(urls.cockpit)}
          className="flex items-center gap-2"
        >
          <Plane className="h-4 w-4" />
          <span className="font-medium">Cockpit</span>
        </Button>
      )}

      {!isHidden('plutono') && (
        <Button
          variant="outline"
          size="sm"
          disabled={!availability.plutono}
          onClick={() => handleToolClick(urls.plutono)}
          className="flex items-center gap-2"
        >
          <PlutonoIcon className="h-4 w-4" />
          <span className="font-medium">Plutono</span>
        </Button>
      )}
    </div>
  );
}