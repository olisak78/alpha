import { apiClient } from './ApiClient';
import type { ComponentListResponse } from '../types/api';
import { DEFAULT_PAGE_SIZE } from '@/constants/developer-portal';





/**
 * Fetch components by team ID
 */
export async function fetchComponentsByTeamId(
  teamId: string
): Promise<ComponentListResponse> {
  return apiClient.get<ComponentListResponse>(`/components?team-id=${teamId}`);
}

/**
 * Fetch all components for an organization
 */
export async function fetchComponentsByOrganization(
  organizationId: string
): Promise<ComponentListResponse> {
  return apiClient.get<ComponentListResponse>('/components', {
    params: { organization_id: organizationId, page_size: DEFAULT_PAGE_SIZE }
  });
}

/**
 * Fetch components by project name
 */
export async function fetchComponentsByProject(
  projectName: string
): Promise<ComponentListResponse> {
  return apiClient.get<ComponentListResponse>('/components', {
    params: { 'project-name': projectName, page_size: DEFAULT_PAGE_SIZE }
  });
}
