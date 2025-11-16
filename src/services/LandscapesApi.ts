import { apiClient } from './ApiClient';
import type { Landscape } from '@/types/developer-portal';


export interface LandscapeApiResponse {
  id: string;
  name: string;
  title?: string;
  description: string;
  domain: string;
  environment: string;
  git?: string;
  concourse?: string;
  kibana?: string;
  dynatrace?: string;
  cockpit?: string;
  'operation-console'?: string;
  type?: string;
  grafana?: string;
  prometheus?: string;
  gardener?: string;
  plutono?: string;
  metadata?: Record<string, any>;
}

export async function fetchLandscapesByProject(
  projectName: string
): Promise<Landscape[]> {
  const response = await apiClient.get<LandscapeApiResponse[]>('/landscapes', {
    params: { 'project-name': projectName }
  });

  // Transform API response to internal Landscape type
  return response.map(landscape => ({
    id: landscape.id, // Keep UUID as id for component filtering
    name: landscape.title || landscape.name, 
    technical_name: landscape.name, 
    status: 'active' as const,
    githubConfig: '#',
    awsAccount: landscape.id,
    camProfile: '#',
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
    type: landscape.type,
    grafana: landscape.grafana,
    prometheus: landscape.prometheus,
    gardener: landscape.gardener,
    plutono: landscape.plutono,
  } as any));
}



export function getDefaultLandscapeId(landscapes: Landscape[]): string | null {
  if (landscapes.length === 0) return null;
  
  // Try to find "Israel (Tel Aviv)"
  const israelLandscape = landscapes.find(l => l.name === 'Israel (Tel Aviv)');
  if (israelLandscape) {
    return israelLandscape.id;
  }
  
  // Return first landscape as fallback
  return landscapes[0].id;
}