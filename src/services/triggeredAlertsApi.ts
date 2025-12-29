import { apiClient } from './ApiClient';
import { TriggeredAlert, TriggeredAlertsResponse, TriggeredAlertsLabelUpdatePayload, TriggeredAlertsFiltersResponse } from '../types/api';

/**
 * Get triggered alerts for a specific project
 * @param projectname - The name of the project
 * @returns Promise<TriggeredAlertsResponse> - List of triggered alerts for the project
 */
export async function getTriggeredAlerts(projectname: string): Promise<TriggeredAlertsResponse> {
  return apiClient.get<TriggeredAlertsResponse>(`/alert-history/alerts/${projectname}`);
}

/**
 * Get a specific triggered alert by project name and fingerprint
 * @param projectname - The name of the project
 * @param fingerprint - The unique fingerprint of the alert
 * @returns Promise<TriggeredAlert> - The specific triggered alert
 */
export async function getTriggeredAlert(projectname: string, fingerprint: string): Promise<TriggeredAlert> {
  return apiClient.get<TriggeredAlert>(`/alert-history/alerts/${projectname}/${fingerprint}`);
}

/**
 * Get list of all project names that have alerts
 * @returns Promise<string[]> - Array of project names
 */
export async function getAlertProjects(): Promise<string[]> {
  return apiClient.get<string[]>('/alert-history/alerts/project');
}

/**
 * Get filters for triggered alerts of a specific project
 * @param projectname - The name of the project
 * @returns Promise<TriggeredAlertsFiltersResponse> - Filter options for the project's alerts
 */
export async function getTriggeredAlertsFilters(projectname: string): Promise<TriggeredAlertsFiltersResponse> {
  return apiClient.get<TriggeredAlertsFiltersResponse>(`/alert-history/alerts/${projectname}/filters`);
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
  return apiClient.put<void>(`/alert-history/alerts/${projectname}/${fingerprint}/label`, payload);
}



export type { TriggeredAlert, TriggeredAlertsResponse, TriggeredAlertsLabelUpdatePayload, TriggeredAlertsFiltersResponse };
