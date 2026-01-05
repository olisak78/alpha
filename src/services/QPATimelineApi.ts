import { apiClient } from './ApiClient';

export interface TaktData {
  [landscapeName: string]: string; // Date string in format "YYYY-MM-DD"
}

export interface YearData {
  [taktName: string]: TaktData; // e.g., "T01A": { "cf-eu10": "2024-01-15", ... }
}

export interface TimelineData {
  [year: string]: YearData; // e.g., "2024": { "T01A": {...}, "T01B": {...} }
}

export interface QPATimelineResponse {
  data: TimelineData;
  responseTime: number;
  statusCode: number;
  success: boolean;
  cached?: boolean;
  cachedAt?: string;
}

export async function fetchQPATimeline(): Promise<QPATimelineResponse> {
  return apiClient.get<QPATimelineResponse>('/cis-public/qpa/timeline');
}
