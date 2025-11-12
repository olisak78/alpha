import { apiClient } from './ApiClient';
import type { Landscape } from '@/types/developer-portal';

/**
 * API response from /api/v1/landscapes endpoint
 */
export interface LandscapeApiResponse {
  id: string;
  name: string;
  title?: string; // Optional - fallback to name if not provided
  description: string;
  domain: string;
  environment: string;
  metadata?: Record<string, any>; // Metadata from backend
}

/**
 * Fetch landscapes by project name
 */
export async function fetchLandscapesByProject(
  projectName: string
): Promise<Landscape[]> {
  const response = await apiClient.get<LandscapeApiResponse[]>('/landscapes', {
    params: { 'project-name': projectName }
  });

  // Transform API response to internal Landscape type
  return response.map(landscape => ({
    id: landscape.id, // Keep UUID as id for component filtering
    name: landscape.title || landscape.name, // Display name (e.g., "Europe (Frankfurt)")
    technical_name: landscape.name, // Technical name from backend (e.g., "cf-eu10-canary")
    status: 'active' as const,
    githubConfig: '#',
    awsAccount: landscape.id,
    camProfile: '#',
    deploymentStatus: 'deployed' as const,
    environment: landscape.environment,
    landscape_url: landscape.domain, // Domain for health checks (e.g., "sap.hana.ondemand.com")
    metadata: landscape.metadata, // Pass through metadata from backend
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