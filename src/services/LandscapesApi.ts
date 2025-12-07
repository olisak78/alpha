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
  git?: string;
  concourse?: string;
  kibana?: string;
  dynatrace?: string;
  cockpit?: string;
  'operation-console'?: string;
  'control-center'?: string;
  type?: string;
  grafana?: string;
  prometheus?: string;
  gardener?: string;
  plutono?: string;
  cam?: string;
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
    git: landscape.git,
    concourse: landscape.concourse,
    kibana: landscape.kibana,
    dynatrace: landscape.dynatrace,
    cockpit: landscape.cockpit,
    'operation-console': landscape['operation-console'],
    'control-center': landscape['control-center'],
    type: landscape.type,
    grafana: landscape.grafana,
    prometheus: landscape.prometheus,
    gardener: landscape.gardener,
    plutono: landscape.plutono,
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
