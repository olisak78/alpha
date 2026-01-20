import { Button } from "@/components/ui/button";
import { useLandscapeTools } from "@/hooks/useLandscapeTools";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ConcourseIcon } from "@/components/icons/ConcourseIcon";
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
import { WorkspaceIcon } from "@/components/icons/WorkspaceIcon";
import { CadIcon } from "./icons/CadIcon";
import { shouldShowSeparator } from "@/config/landscapeToolCategories";
import { useRef } from "react";

export type ToolButton = 'git' | 'concourse' | 'applicationLogging' | 'platformLogging' | 'dynatrace' | 'avs' | 'plutono' | 'cockpit' | 'operationConsole' |
  'controlCenter' | 'cam' | 'gardener' | 'vault' | 'iaasConsole' | 'iaasConsoleBS' | 'workspace' | 'cad' | 'kibana';

interface LandscapeToolsButtonsProps {
  selectedLandscape: string | null;
  landscapeData?: any;
}

// Separator component - minimalistic vertical line
const Separator = () => (
  <div className="flex items-center justify-center px-2">
    <div className="h-6 w-px bg-muted-foreground/40" />
  </div>
);

export function LandscapeToolsButtons({ selectedLandscape, landscapeData }: LandscapeToolsButtonsProps) {
  const { urls, availability } = useLandscapeTools(selectedLandscape, landscapeData);

  // Track the last rendered tool for separator logic
  const lastRenderedTool = useRef<string | null>(null);

  // Helper to check and render separator if needed
  const renderSeparatorIfNeeded = (currentTool: string) => {
    if (shouldShowSeparator(currentTool, lastRenderedTool.current)) {
      return <Separator key={`sep-${currentTool}`} />;
    }
    return null;
  };

  // Helper to update last rendered tool
  const updateLastRenderedTool = (tool: string) => {
    lastRenderedTool.current = tool;
  };

  const handleToolClick = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if no landscape is selected
  if (!selectedLandscape) {
    return null;
  }

  // Reset the last rendered tool on each render
  lastRenderedTool.current = null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {availability.git && (
        <>
          {renderSeparatorIfNeeded('git')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.git)}
            className="flex items-center gap-2"
          >
            <GithubIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Git</span>
          </Button>
          {updateLastRenderedTool('git')}
        </>
      )}

      {availability.vault && (
        <>
          {renderSeparatorIfNeeded('vault')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.vault)}
            className="flex items-center gap-2"
          >
            <VaultIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Vault</span>
          </Button>
          {updateLastRenderedTool('vault')}
        </>
      )}

      {availability.workspace && (
        <>
          {renderSeparatorIfNeeded('workspace')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.workspace)}
            className="flex items-center gap-2"
          >
            <WorkspaceIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Workspace</span>
          </Button>
          {updateLastRenderedTool('workspace')}
        </>
      )}

      {availability.concourse && (
        <>
          {renderSeparatorIfNeeded('concourse')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.concourse)}
            className="flex items-center gap-2"
          >
            <ConcourseIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Concourse</span>
          </Button>
          {updateLastRenderedTool('concourse')}
        </>
      )}

      {availability.applicationLogging && (
        <>
          {renderSeparatorIfNeeded('applicationLogging')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.applicationLogging)}
            className="flex items-center gap-2"
          >
            <LogsIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">App Logs</span>
          </Button>
          {updateLastRenderedTool('applicationLogging')}
        </>
      )}

      {availability.platformLogging && (
        <>
          {renderSeparatorIfNeeded('platformLogging')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.platformLogging)}
            className="flex items-center gap-2"
          >
            <LogsIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Infra Logs</span>
          </Button>
          {updateLastRenderedTool('platformLogging')}
        </>
      )}

      {availability.dynatrace && (
        <>
          {renderSeparatorIfNeeded('dynatrace')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.dynatrace)}
            className="flex items-center gap-2"
          >
            <DynatraceIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Dynatrace</span>
          </Button>
          {updateLastRenderedTool('dynatrace')}
        </>
      )}

      {availability.plutono && (
        <>
          {renderSeparatorIfNeeded('plutono')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.plutono)}
            className="flex items-center gap-2"
          >
            <GrafanaIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Plutono</span>
          </Button>
          {updateLastRenderedTool('plutono')}
        </>
      )}

      {availability.gardener && (
        <>
          {renderSeparatorIfNeeded('gardener')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.gardener)}
            className="flex items-center gap-2"
          >
            <GardenerIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Gardener</span>
          </Button>
          {updateLastRenderedTool('gardener')}
        </>
      )}

      {availability.iaasConsole && (
        <>
          {renderSeparatorIfNeeded('iaasConsole')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.iaasConsole)}
            className="flex items-center gap-2"
          >
            <IaasIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">IaaS</span>
          </Button>
          {updateLastRenderedTool('iaasConsole')}
        </>
      )}

      {availability.iaasConsoleBS && (
        <>
          {renderSeparatorIfNeeded('iaasConsoleBS')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.iaasConsoleBS)}
            className="flex items-center gap-2"
          >
            <IaasIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">IaaS (BS)</span>
          </Button>
          {updateLastRenderedTool('iaasConsoleBS')}
        </>
      )}

      {availability.avs && (
        <>
          {renderSeparatorIfNeeded('avs')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.avs)}
            className="flex items-center gap-2"
          >
            <AvsIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">AVS</span>
          </Button>
          {updateLastRenderedTool('avs')}
        </>
      )}

      {availability.cam && (
        <>
          {renderSeparatorIfNeeded('cam')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.cam)}
            className="flex items-center gap-2"
          >
            <CamIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">CAM</span>
          </Button>
          {updateLastRenderedTool('cam')}
        </>
      )}

      {availability.operationConsole && (
        <>
          {renderSeparatorIfNeeded('operationConsole')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.operationConsole)}
            className="flex items-center gap-2"
          >
            <OperationConsoleIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Operation Console</span>
          </Button>
          {updateLastRenderedTool('operationConsole')}
        </>
      )}

      {availability.cockpit && (
        <>
          {renderSeparatorIfNeeded('cockpit')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.cockpit)}
            disabled={!landscapeData?.isCentral}
            className="flex items-center gap-2"
            title={!landscapeData?.isCentral ? "Cockpit is only available in central landscapes" : undefined}
          >
            <CockpitIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Cockpit</span>
          </Button>
          {updateLastRenderedTool('cockpit')}
        </>
      )}

      {availability.controlCenter && (
        <>
          {renderSeparatorIfNeeded('controlCenter')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.controlCenter)}
            className="flex items-center gap-2"
          >
            <ControlCenterIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">Control Center</span>
          </Button>
          {updateLastRenderedTool('controlCenter')}
        </>
      )}

      {availability.cad && (
        <>
          {renderSeparatorIfNeeded('cad')}
          <Button
            variant="outline"
            size="default"
            onClick={() => handleToolClick(urls.cad)}
            className="flex items-center gap-2"
          >
            <CadIcon className="h-6 w-6" />
            <span className="font-semibold text-sm">CAD</span>
          </Button>
          {updateLastRenderedTool('cad')}
        </>
      )}
    </div>
  );
}