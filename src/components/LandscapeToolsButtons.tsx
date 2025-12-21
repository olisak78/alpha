import { Button } from "@/components/ui/button";
import { useLandscapeTools } from "@/hooks/useLandscapeTools";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ConcourseIcon } from "@/components/icons/ConcourseIcon";
import { KibanaIcon } from "@/components/icons/KibanaIcon";
import { DynatraceIcon } from "@/components/icons/DynatraceIcon";
import { GrafanaIcon } from "@/components/icons/GrafanaIcon";
import { AvsIcon } from "@/components/icons/AvsIcon";
import { VaultIcon } from "@/components/icons/VaultIcon";
import { CamIcon } from "@/components/icons/CamIcon";
import { IaasIcon } from "@/components/icons/IaasIcon";
import { LogsIcon } from "@/components/icons/LogsIcon";
import { GardenerIcon } from "@/components/icons/GardenerIcon";
import { ControlCenterIcon } from "@/components/icons/ControlCenterIcon";
import { CockpitIcon } from "@/components/icons/CockpitIcon";
import { OperationConsoleIcon } from "@/components/icons/OperationConsoleIcon";

export type ToolButton = 'git' | 'concourse' | 'applicationLogging' | 'platformLogging' | 'dynatrace' | 'avs' | 'plutono' | 'cockpit' | 'operationConsole' | 'controlCenter' | 'cam' | 'gardener' | 'vault' | 'iaasConsole' | 'iaasConsoleBS';

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
    <div className="flex items-center gap-2 flex-wrap">
      {availability.git && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.git)}
          className="flex items-center gap-2"
        >
          <GithubIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Git</span>
        </Button>
      )}

      {availability.vault && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.vault)}
          className="flex items-center gap-2"
        >
          <VaultIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Vault</span>
        </Button>
      )}

      {availability.concourse && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.concourse)}
          className="flex items-center gap-2"
        >
          <ConcourseIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Concourse</span>
        </Button>
      )}

      {availability.applicationLogging && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.applicationLogging)}
          className="flex items-center gap-2"
        >
          <LogsIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">App Logs</span>
        </Button>
      )}

      {availability.platformLogging && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.platformLogging)}
          className="flex items-center gap-2"
        >
          <LogsIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Infra Logs</span>
        </Button>
      )}

      {availability.dynatrace && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.dynatrace)}
          className="flex items-center gap-2"
        >
          <DynatraceIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Dynatrace</span>
        </Button>
      )}

       {availability.plutono && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.plutono)}
          className="flex items-center gap-2"
        >
          <GrafanaIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Plutono</span>
        </Button>
      )}

      {availability.gardener && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.gardener)}
          className="flex items-center gap-2"
        >
          <GardenerIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Gardener</span>
        </Button>
      )}

      {availability.iaasConsole && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.iaasConsole)}
          className="flex items-center gap-2"
        >
          <IaasIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">IaaS</span>
        </Button>
      )}

      {availability.iaasConsoleBS && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.iaasConsoleBS)}
          className="flex items-center gap-2"
        >
          <IaasIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">IaaS (BS)</span>
        </Button>
      )}

      {availability.avs && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.avs)}
          className="flex items-center gap-2"
        >
          <AvsIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">AVS</span>
        </Button>
      )}

      {availability.cam && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.cam)}
          className="flex items-center gap-2"
        >
          <CamIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">CAM</span>
        </Button>
      )}

      {availability.operationConsole && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.operationConsole)}
          className="flex items-center gap-2"
        >
          <OperationConsoleIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Operation Console</span>
        </Button>
      )}

      {availability.cockpit && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.cockpit)}
          className="flex items-center gap-2"
        >
          <CockpitIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Cockpit</span>
        </Button>
      )}

      {availability.controlCenter && (
        <Button
          variant="outline"
          size="default"
          onClick={() => handleToolClick(urls.controlCenter)}
          className="flex items-center gap-2"
        >
          <ControlCenterIcon className="h-6 w-6" />
          <span className="font-semibold text-sm">Control Center</span>
        </Button>
      )}
    </div>
  );
}
