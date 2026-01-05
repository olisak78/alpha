import { apiClient } from './ApiClient';
import { Project, ProjectResponse } from '@/types/api';

/**
 * Fetch all projects
 */
export async function fetchProjects(): Promise<Project[]> {
  const response = await apiClient.get<Project[]>('/projects');
  return response;
}

