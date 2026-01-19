import { useMemo } from 'react';

interface LandscapeData {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  domain?: string;
  environment?: string;
  'application-logging'?: string;
  'avs-aggregated-monitor'?: string;
  git?: string;
  concourse?: string;
  kibana?: string; // Deprecated, use application-logging
  dynatrace?: string;
  cockpit?: string;
  'operation-console'?: string;
  'control-center'?: string;
  'platform-logging'?: string;
  type?: string;
  grafana?: string;
  prometheus?: string;
  gardener?: string;
  plutono?: string;
  cam?: string;
  vault?: string;
  'iaas-console'?: string;
  'iaas-console-backing-service'?: string;
  workspace?: string;
  cad?: string;
}

interface LandscapeToolUrls {
  git: string | null;
  concourse: string | null;
  applicationLogging: string | null;
  kibana: string | null; // Deprecated, use applicationLogging
  platformLogging: string | null;
  dynatrace: string | null;
  avs: string | null;
  cockpit: string | null;
  plutono: string | null;
  operationConsole: string | null;
  controlCenter: string | null;
  cam: string | null;
  gardener: string | null;
  vault: string | null;
  iaasConsole: string | null;
  iaasConsoleBS: string | null;
  workspace: string | null;
  cad: string | null;
}

interface LandscapeToolsAvailability {
  git: boolean;
  concourse: boolean;
  applicationLogging: boolean;
  kibana: boolean; // Deprecated
  platformLogging: boolean;
  dynatrace: boolean;
  avs: boolean;
  cockpit: boolean;
  plutono: boolean;
  operationConsole: boolean;
  controlCenter: boolean;
  cam: boolean;
  gardener: boolean;
  vault: boolean;
  iaasConsole: boolean;
  iaasConsoleBS: boolean;
  workspace: boolean;
  cad: boolean;
}

interface UseLandscapeToolsReturn {
  urls: LandscapeToolUrls;
  availability: LandscapeToolsAvailability;
}


export function useLandscapeTools(
  selectedLandscapeId: string | null,
  landscapeData?: LandscapeData | null
): UseLandscapeToolsReturn {
  return useMemo(() => {
    const emptyState = {
      urls: {
        git: null,
        concourse: null,
        applicationLogging: null,
        kibana: null,
        platformLogging: null,
        dynatrace: null,
        avs: null,
        cockpit: null,
        plutono: null,
        operationConsole: null,
        controlCenter: null,
        cam: null,
        gardener: null,
        vault: null,
        iaasConsole: null,
        iaasConsoleBS: null,
        workspace: null,
        cad: null
      },
      availability: {
        git: false,
        concourse: false,
        applicationLogging: false,
        kibana: false,
        platformLogging: false,
        dynatrace: false,
        avs: false,
        cockpit: false,
        plutono: false,
        operationConsole: false,
        controlCenter: false,
        cam: false,
        gardener: false,
        vault: false,
        iaasConsole: false,
        iaasConsoleBS: false,
        workspace: false,
        cad: false
      }
    };

    if (!selectedLandscapeId || !landscapeData) {
      return emptyState;
    }

    const gitUrl = landscapeData.git || null;
    const concourseUrl = landscapeData.concourse || null;
    const applicationLoggingUrl = landscapeData['application-logging'] || landscapeData.kibana || null;
    const kibanaUrl = landscapeData.kibana || null; // Deprecated
    const platformLoggingUrl = landscapeData['platform-logging'] || null;
    const dynatraceUrl = landscapeData.dynatrace || null;
    const avsUrl = landscapeData['avs-aggregated-monitor'] || null;
    const cockpitUrl = landscapeData.cockpit || null;
    const plutonoUrl = landscapeData.plutono || null;
    const operationConsoleUrl = landscapeData['operation-console'] || null;
    const controlCenterUrl = landscapeData['control-center'] || null;
    const camUrl = landscapeData.cam || null;
    const gardenerUrl = landscapeData.gardener || null;
    const vaultUrl = landscapeData.vault || null;
    const iaasConsoleUrl = landscapeData['iaas-console'] || null;
    const iaasConsoleBSUrl = landscapeData['iaas-console-backing-service'] || null;
    const workspaceUrl = landscapeData['workspace'] || null;
    const cadUrl = landscapeData['cad'] || null;

    return {
      urls: {
        git: gitUrl,
        concourse: concourseUrl,
        applicationLogging: applicationLoggingUrl,
        kibana: kibanaUrl,
        platformLogging: platformLoggingUrl,
        dynatrace: dynatraceUrl,
        avs: avsUrl,
        cockpit: cockpitUrl,
        plutono: plutonoUrl,
        operationConsole: operationConsoleUrl,
        controlCenter: controlCenterUrl,
        cam: camUrl,
        gardener: gardenerUrl,
        vault: vaultUrl,
        iaasConsole: iaasConsoleUrl,
        iaasConsoleBS: iaasConsoleBSUrl,
        workspace: workspaceUrl,
        cad: cadUrl
      },
      availability: {
        git: !!gitUrl,
        concourse: !!concourseUrl,
        applicationLogging: !!applicationLoggingUrl,
        kibana: !!kibanaUrl,
        platformLogging: !!platformLoggingUrl,
        dynatrace: !!dynatraceUrl,
        avs: !!avsUrl,
        cockpit: !!cockpitUrl,
        plutono: !!plutonoUrl,
        operationConsole: !!operationConsoleUrl,
        controlCenter: !!controlCenterUrl,
        cam: !!camUrl,
        gardener: !!gardenerUrl,
        vault: !!vaultUrl,
        iaasConsole: !!iaasConsoleUrl,
        iaasConsoleBS: !!iaasConsoleBSUrl,
        workspace: !!workspaceUrl,
        cad: !!cadUrl
      }
    };
  }, [selectedLandscapeId, landscapeData]);
}
