import { apiClient } from './ApiClient';
import { TriggeredAlert, TriggeredAlertsResponse, TriggeredAlertsLabelUpdatePayload, TriggeredAlertsFiltersResponse } from '../types/api';

/**
 * Query parameters for triggered alerts API
 */
export interface TriggeredAlertsQueryParams {
  page?: number;
  pageSize?: number;
  severity?: string;
  region?: string;
  landscape?: string;
  status?: string;
  alertname?: string;
  start_time?: string;
  end_time?: string;
}

/**
 * Get triggered alerts for a specific project
 * @param projectname - The name of the project
 * @param params - Optional query parameters for filtering and pagination
 * @returns Promise<TriggeredAlertsResponse> - List of triggered alerts for the project
 */
export async function getTriggeredAlerts(
  projectname: string, 
  params?: TriggeredAlertsQueryParams
): Promise<TriggeredAlertsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
    if (params.severity) queryParams.append('severity', params.severity);
    if (params.region) queryParams.append('region', params.region);
    if (params.landscape) queryParams.append('landscape', params.landscape);
    if (params.status) queryParams.append('status', params.status);
    if (params.alertname) queryParams.append('alertname', params.alertname);
    if (params.start_time) queryParams.append('start_time', params.start_time);
    if (params.end_time) queryParams.append('end_time', params.end_time);
  }
  
  const url = `/alert-storage/alerts/${projectname}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiClient.get<TriggeredAlertsResponse>(url);
}

/**
 * Get a specific triggered alert by project name and fingerprint
 * @param projectname - The name of the project
 * @param fingerprint - The unique fingerprint of the alert
 * @returns Promise<TriggeredAlert> - The specific triggered alert
 */
export async function getTriggeredAlert(projectname: string, fingerprint: string): Promise<TriggeredAlert> {
  return apiClient.get<TriggeredAlert>(`/alert-storage/alerts/${projectname}/${fingerprint}`);
}

/**
 * Get list of all project names that have alerts
 * @returns Promise<string[]> - Array of project names
 */
export async function getAlertProjects(): Promise<string[]> {
  return apiClient.get<string[]>('/alert-storage/alerts/project');
}

/**
 * Get filters for triggered alerts of a specific project
 * @param projectname - The name of the project
 * @returns Promise<TriggeredAlertsFiltersResponse> - Filter options for the project's alerts
 */
export async function getTriggeredAlertsFilters(projectname: string): Promise<TriggeredAlertsFiltersResponse> {
  return apiClient.get<TriggeredAlertsFiltersResponse>(`/alert-storage/alerts/${projectname}/filters`);
}

/**
 * Update label for a specific triggered alert
 * @param projectname - The name of the project
 * @param fingerprint - The unique fingerprint of the alert
 * @param payload - The label update payload
 * @returns Promise<void> - No response body expected for PUT request
 */
export async function updateTriggeredAlertLabel(
  projectname: string,
  fingerprint: string,
  payload: TriggeredAlertsLabelUpdatePayload
): Promise<void> {
  return apiClient.put<void>(`/alert-storage/alerts/${projectname}/${fingerprint}/label`, payload);
}



export type { TriggeredAlert, TriggeredAlertsResponse, TriggeredAlertsLabelUpdatePayload, TriggeredAlertsFiltersResponse };
