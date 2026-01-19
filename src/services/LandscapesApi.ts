import { apiClient } from './ApiClient';
import type { Landscape } from '@/types/developer-portal';


export interface LandscapeApiResponse {
  id: string;
  name: string;
  title?: string;
  description: string;
  domain: string;
  environment: string;
  'is-central-region'?: boolean;
  'application-logging'?: string;
  'avs-aggregated-monitor'?: string;
  git?: string;
  concourse?: string;
  kibana?: string;
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
  metadata?: Record<string, any>;
}

export async function fetchLandscapesByProject(
  projectName: string
): Promise<Landscape[]> {
  const response = await apiClient.get<LandscapeApiResponse[]>('/landscapes', {
    params: { 'project-name': projectName }
  });

  // Transform API response to internal Landscape type
  return response.map(landscape => {
    return {
      id: landscape.id, // Keep UUID as id for component filtering
      name: landscape.title || landscape.name,
      technical_name: landscape.name,
      status: 'active' as const,
      githubConfig: '#',
      awsAccount: landscape.id,
      cam: landscape.cam,
      deploymentStatus: 'deployed' as const,
      environment: landscape.environment,
      landscape_url: landscape.domain,
      metadata: landscape.metadata,
      title: landscape.title,
      domain: landscape.domain,
      'application-logging': landscape['application-logging'],
      'avs-aggregated-monitor': landscape['avs-aggregated-monitor'],
      git: landscape.git,
      concourse: landscape.concourse,
      kibana: landscape.kibana,
      dynatrace: landscape.dynatrace,
      cockpit: landscape.cockpit,
      'operation-console': landscape['operation-console'],
      'control-center': landscape['control-center'],
      'platform-logging': landscape['platform-logging'],
      type: landscape.type,
      grafana: landscape.grafana,
      prometheus: landscape.prometheus,
      gardener: landscape.gardener,
      plutono: landscape.plutono,
      vault: landscape.vault,
      workspace: landscape.workspace,
      cad: landscape['cad'],
      'iaas-console': landscape['iaas-console'],
      'iaas-console-backing-service': landscape['iaas-console-backing-service'],
      isCentral: landscape['is-central-region'] || false,
    } as any;
  });
}



export function getDefaultLandscapeId(landscapes: Landscape[], projectName?: string): string | null {
  if (landscapes.length === 0) return null;

  // 1. Always prefer staging environment and isCentral
  const stagingCentralLandscape = landscapes.find(l =>
    l.environment === 'staging' && l.isCentral === true
  );
  if (stagingCentralLandscape) {
    return stagingCentralLandscape.id;
  }

  // 2. If no central staging, look for landscape matching pattern {projectname}-staging or staging-{projectname}
  if (projectName) {
    const projectStagingLandscape = landscapes.find(l => {
      const technicalName = l.technical_name?.toLowerCase() || '';
      const projectNameLower = projectName.toLowerCase();
      return (
        l.environment === 'staging' && (
          technicalName === `${projectNameLower}-staging` ||
          technicalName === `staging-${projectNameLower}` ||
          technicalName.includes(`${projectNameLower}-staging`) ||
          technicalName.includes(`staging-${projectNameLower}`)
        )
      );
    });
    if (projectStagingLandscape) {
      return projectStagingLandscape.id;
    }
  }

  // 3. Special case for Cloud Automation project - prefer cloud-automation-staging
  if (projectName && projectName.toLowerCase() === 'ca') {
    const cloudAutomationStagingLandscape = landscapes.find(l => {
      const technicalName = l.technical_name?.toLowerCase() || '';
      return technicalName === 'cloud-automation-staging' ||
        technicalName.includes('cloud-automation-staging');
    });
    if (cloudAutomationStagingLandscape) {
      return cloudAutomationStagingLandscape.id;
    }
  }

  // 4. Fallback to any staging landscape
  const anyStagingLandscape = landscapes.find(l => l.environment === 'staging');
  if (anyStagingLandscape) {
    return anyStagingLandscape.id;
  }

  // 5. Final fallback to first landscape
  return landscapes[0].id;
}
