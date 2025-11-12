import { apiClient } from './ApiClient';
import type { ComponentMetadata, SonarMeasuresResponse, SonarMetrics } from '@/types/api';


export async function fetchSonarMeasures(
  componentAlias: string
): Promise<SonarMeasuresResponse> {
  const response = await apiClient.get<SonarMeasuresResponse>('/sonar/measures', {
    params: { component: componentAlias }
  });
  
  return response;
}


export function parseSonarMetrics(response: SonarMeasuresResponse): SonarMetrics {
  // Parse the status field for Quality Gate first
  const qualityGate = response.status === 'OK' ? 'Passed' : 'Failed';
  
  const metrics: SonarMetrics = {
    coverage: null,
    codeSmells: null,
    vulnerabilities: null,
    qualityGate: qualityGate as 'Passed' | 'Failed'
  };

  response.measures.forEach(measure => {
    const numValue = parseFloat(measure.value);
    
    switch (measure.metric) {
      case 'coverage':
        metrics.coverage = isNaN(numValue) ? null : numValue;
        break;
      case 'code_smells':
        metrics.codeSmells = isNaN(numValue) ? null : Math.floor(numValue);
        break;
      case 'vulnerabilities':
        metrics.vulnerabilities = isNaN(numValue) ? null : Math.floor(numValue);
        break;
    }
  });

  return metrics;
}


export function extractSonarComponentAlias(
  sonarField?: string | null
): string | null {
  // Extract from the sonar field
  if (!sonarField || typeof sonarField !== 'string') {
    return null;
  }
  
  // Check if it's a URL
  if (sonarField.startsWith('http://') || sonarField.startsWith('https://')) {
    try {
      const url = new URL(sonarField);
      // Extract the 'id' query parameter
      const projectKey = url.searchParams.get('id');
      return projectKey;
    } catch (e) {
      // If URL parsing fails, log and return null
      console.warn('Failed to parse Sonar URL:', sonarField, e);
      return null;
    }
  }
  
  // If it's not a URL, use it directly as the key
  return sonarField;
}