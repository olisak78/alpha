import { Button } from "@/components/ui/button";
import { useLandscapeTools } from "@/hooks/useLandscapeTools";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ConcourseIcon } from "@/components/icons/ConcourseIcon";
import { KibanaIcon } from "@/components/icons/KibanaIcon";
import { DynatraceIcon } from "@/components/icons/DynatraceIcon";
import { PlutonoIcon } from "@/components/icons/PlutonoIcon";
import { Plane, Monitor, Settings, FileText, Flower } from "lucide-react";

export type ToolButton = 'git' | 'concourse' | 'kibana' | 'dynatrace' | 'plutono' | 'cockpit' | 'operationConsole' | 'controlCenter' | 'cam' | 'gardener';

interface LandscapeToolsButtonsProps {
  selectedLandscape: string | null;
  landscapeData?: any;
}

export function LandscapeToolsButtons({ selectedLandscape, landscapeData }: LandscapeToolsButtonsProps) {
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

  return (
    <div className="flex items-center gap-2">
      {availability.git && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.git)}
          className="flex items-center gap-2"
        >
          <GithubIcon className="h-4 w-4" />
          <span className="font-medium">Git</span>
        </Button>
      )}

      {availability.concourse && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.concourse)}
          className="flex items-center gap-2"
        >
          <ConcourseIcon className="h-4 w-4" />
          <span className="font-medium">Concourse</span>
        </Button>
      )}

        {availability.kibana && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.kibana)}
          className="flex items-center gap-2"
        >
          <KibanaIcon className="h-4 w-4" />
          <span className="font-medium">Kibana</span>
        </Button>
      )}

      {availability.dynatrace && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.dynatrace)}
          className="flex items-center gap-2"
        >
          <DynatraceIcon className="h-4 w-4" />
          <span className="font-medium">Dynatrace</span>
        </Button>
      )}

      {availability.cockpit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.cockpit)}
          className="flex items-center gap-2"
        >
          <Plane className="h-4 w-4" />
          <span className="font-medium">Cockpit</span>
        </Button>
      )}

       {availability.plutono && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.plutono)}
          className="flex items-center gap-2"
        >
          <PlutonoIcon className="h-4 w-4" />
          <span className="font-medium">Plutono</span>
        </Button>
      )}

      {availability.operationConsole && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.operationConsole)}
          className="flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          <span className="font-medium">Operation Console</span>
        </Button>
      )}

      {availability.controlCenter && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.controlCenter)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          <span className="font-medium">Control Center</span>
        </Button>
      )}

      {availability.cam && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.cam)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          <span className="font-medium">CAM</span>
        </Button>
      )}

      {availability.gardener && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToolClick(urls.gardener)}
          className="flex items-center gap-2"
        >
          <Flower className="h-4 w-4" />
          <span className="font-medium">Gardener</span>
        </Button>
      )}
    </div>
  );
}
