import { apiClient } from './ApiClient';
import type {
  ConcourseLatestExecutionResponse,
  ConcourseJobsResponse,
} from '@/types/concourse';

/**
 * Fetches the latest execution number from the concourse-status-developer-portal Jenkins job
 * @returns Promise with the latest build number
 */
export async function fetchConcourseLatestExecution(): Promise<ConcourseLatestExecutionResponse> {
  const response = await apiClient.get<ConcourseLatestExecutionResponse>(
    '/concourse/latest-execution'
  );
  return response;
}

/**
 * Fetches concourse jobs data from Jenkins artifact
 * @param landscape - Optional landscape filter (e.g., 'cf-ae01'). Omit or use 'all' for all landscapes
 * @returns Promise with concourse jobs data organized by landscape
 */
export async function fetchConcourseJobs(
  landscape?: string
): Promise<ConcourseJobsResponse> {
  const params = landscape && landscape !== 'all' ? { landscape } : {};

  const response = await apiClient.get<ConcourseJobsResponse>(
    '/concourse/jobs',
    { params }
  );

  return response;
}
