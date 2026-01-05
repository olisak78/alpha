import { apiClient } from './ApiClient';

interface Alert {
  alert: string;
  expr: string;
  for?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  _group?: string;
}

interface AlertFile {
  name: string;
  path: string;
  content: string;
  category: string;
  alerts: Alert[];
}

interface AlertsResponse {
  files: AlertFile[];
}

interface CreateAlertPRPayload {
  fileName: string;
  content: string;
  message: string;
  description: string;
}

interface CreateAlertPRResponse {
  message: string;
  prUrl: string;
}

export async function fetchAlerts(projectId: string): Promise<AlertsResponse> {
  return apiClient.get<AlertsResponse>(`/projects/${projectId}/alerts`);
}

export async function createAlertPR(
  projectId: string,
  payload: CreateAlertPRPayload
): Promise<CreateAlertPRResponse> {
  return apiClient.post<CreateAlertPRResponse>(
    `/projects/${projectId}/alerts/pr`,
    payload
  );
}

export type { Alert, AlertFile, AlertsResponse, CreateAlertPRPayload, CreateAlertPRResponse };
