import { apiClient } from './ApiClient';
import type { JenkinsJobParametersResponse, JenkinsJobField } from '../types/api';

/**
 * Legacy response format from Jenkins API
 */
interface LegacyJenkinsJobParametersResponse {
  parameterDefinitions: JenkinsJobField[];
}

/**
 * Maps old Jenkins parameter types to new form element types
 */
function mapParameterType(oldType: string): string {
  const typeMapping: Record<string, string> = {
    'BooleanParameterDefinition': 'checkbox',
    'PT_RADIO': 'radio',
    'StringParameterDefinition': 'text',
    'ExtendedChoiceParameterDefinition': 'select'
  };
  
  return typeMapping[oldType] || oldType;
}

/**
 * Core function to fetch Jenkins job parameters from the API
 * Handles the legacy format transformation to modern step-based structure
 */
async function fetchJenkinsJobParametersFromApi(
  jaasName: string,
  jobName: string
): Promise<JenkinsJobField[]> {
  const response = await apiClient.get<LegacyJenkinsJobParametersResponse>(
    `/self-service/jenkins/${jaasName}/${jobName}/parameters`
  );
  
  const parameters = response.parameterDefinitions || [];
  
  // Map old parameter types to new form element types
  return parameters.map(param => ({
    ...param,
    type: mapParameterType(param.type)
  }));
}

/**
 * Fetch Jenkins job parameters for a specific JAAS name and job name
 * Returns parameters wrapped in a single step for simple dynamic jobs
 */
export async function fetchJenkinsJobParameters(
  jaasName: string,
  jobName: string
): Promise<JenkinsJobParametersResponse> {
  const fields = await fetchJenkinsJobParametersFromApi(jaasName, jobName);
  
  return {
    steps: [{
      name: 'parameters',
      fields
    }]
  };
}

/**
 * Fetch and populate dynamic steps with Jenkins job parameters
 * Takes a configuration with steps and populates dynamic steps with API data
 */
export async function fetchAndPopulateDynamicSteps(
  jaasName: string,
  jobName: string,
  steps: { name: string; title?: string; description?: string; isDynamic?: boolean; fields?: any[] }[]
): Promise<JenkinsJobParametersResponse> {
  const hasDynamicSteps = steps.some(step => step.isDynamic);
  
  // Early return if no dynamic steps exist to avoid unnecessary processing
  if (!hasDynamicSteps) {
    return {
      steps: steps
    };
  }
  
  // Fetch Jenkins parameters once for all dynamic steps
  const jenkinsFields = await fetchJenkinsJobParametersFromApi(jaasName, jobName);
  
  const populatedSteps = steps.map((step) => {
    if (step.isDynamic) {
      return {
        ...step,
        fields: jenkinsFields
      };
    }
    
    // Return static step as-is
    return step;
  });

  return {
    steps: populatedSteps
  };
}

export async function triggerJenkinsJob(
  jaasName: string,
  jobName: string,
  parameters: Record<string, any>
): Promise<{ 
  success: boolean; 
  message?: string; 
  queueItemId?: string; 
  queueUrl?: string;
  buildUrl?: string;
}> {
  return apiClient.post<{ 
    success: boolean; 
    message?: string; 
    queueItemId?: string; 
    queueUrl?: string;
    buildUrl?: string;
  }>(
    `/self-service/jenkins/${jaasName}/${jobName}/trigger-tracked`,
    parameters
  );
}

export interface JenkinsQueueStatusResponse {
  status: string; // 'queued', 'running', 'success', 'failed', etc.
  message?: string;
  buildNumber?: number;
  buildUrl?: string;
  queueUrl?: string;
  jaasName?: string;
  jobName?: string;
  waitTime?: number; // Wait time in milliseconds for queued jobs

}

/**
 * Fetch the status of a Jenkins queue item
 * 
 * @param jaasName - Jenkins JAAS name
 * @param queueItemId - Queue item ID from trigger response
 * @returns Queue item status information
 */
export async function fetchJenkinsQueueStatus(
  jaasName: string,
  queueItemId: string
): Promise<JenkinsQueueStatusResponse> {
  return apiClient.get<JenkinsQueueStatusResponse>(
    `/self-service/jenkins/${jaasName}/queue/${queueItemId}/status`
  );
}

export interface JenkinsBuildStatusResponse {
  buildNumber: number;
  buildUrl: string;
  queuedReason?: string;
  status: string; // 'queued', 'running', 'success', 'failed', etc.
  waitTime?: number;
  duration?: number; // Duration in milliseconds
}

/**
 * Fetch the status of a Jenkins build
 * 
 * @param jaasName - Jenkins JAAS name
 * @param jobName - Jenkins job name
 * @param buildNumber - Build number
 * @returns Build status information
 */
export async function fetchJenkinsBuildStatus(
  jaasName: string,
  jobName: string,
  buildNumber: number
): Promise<JenkinsBuildStatusResponse> {
  return apiClient.get<JenkinsBuildStatusResponse>(
    `/self-service/jenkins/${jaasName}/${jobName}/${buildNumber}/status`
  );
}

export interface JenkinsJobHistoryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  jaasName: string;
  jobName: string;
  queueItemId: string;
  queueUrl: string;
  baseJobUrl: string;
  status: string;
  buildNumber: number;
  buildUrl: string;
  queuedReason: string;
  waitTime: number;
  building: boolean;
  duration: number;
  result: string;
  triggeredBy: string;
  parameters: Record<string, any>;
  metadata: any;
  resultJson: any;
  lastPolledAt: string;
  pollingActive: boolean;
  completedAt: string;
  errorMessage: string;
  pollAttempts: number;
}

export interface JenkinsJobHistoryResponse {
  jobs: JenkinsJobHistoryItem[];
  limit: number;
  offset: number;
  total: number;
}

/**
 * Fetch Jenkins job history with pagination and time filtering
 * 
 * @param limit - Number of jobs to return per page
 * @param offset - Offset for pagination
 * @param onlyMine - If true, fetch only current user's jobs. Default: true
 * @param lastUpdated - Number of hours to look back for job updates. Default: 48
 * @returns Job history with pagination info
 */
export async function fetchJenkinsJobHistory(
  limit: number = 10,
  offset: number = 0,
  onlyMine: boolean = true,
  lastUpdated: number = 48
): Promise<JenkinsJobHistoryResponse> {
  return apiClient.get<JenkinsJobHistoryResponse>(
    `/self-service/jenkins/jobs?limit=${limit}&offset=${offset}&only_mine=${onlyMine}&last_updated=${lastUpdated}`
  );
}

export interface JenkinsJobOutputItem {
  description: string;
  displayName: string;
  id: string;
  type: string;
  value: string;
}

/**
 * Fetch output for a specific Jenkins job build
 */
export const fetchJenkinsJobOutput = async (
  jaasName: string,
  jobName: string,
  buildNumber: number
): Promise<JenkinsJobOutputItem[]> => {
  const response = await apiClient.get<JenkinsJobOutputItem[]>(
    `/self-service/jenkins/${jaasName}/${jobName}/${buildNumber}/output`
  );
  return response;
};