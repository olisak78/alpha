import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchSonarMeasures, parseSonarMetrics, extractSonarComponentAlias } from '@/services/SonarApi';
import type { SonarMetrics } from '@/types/api';


export function useSonarMeasures(
  sonarField?: string | null,
  enabled: boolean = true
): UseQueryResult<SonarMetrics, Error> & { hasAlias: boolean } {
  const componentAlias = extractSonarComponentAlias(sonarField);
  const hasAlias = componentAlias !== null;

  const queryResult = useQuery<SonarMetrics, Error>({
    queryKey: ['sonar', 'measures', componentAlias],
    queryFn: async () => {
      if (!componentAlias) {
        // Return null metrics if no alias
        return {
          coverage: null,
          codeSmells: null,
          vulnerabilities: null,
          qualityGate: null
        };
      }
      const response = await fetchSonarMeasures(componentAlias);
       const parsed = parseSonarMetrics(response);      
      return parsed;
    },
    enabled: enabled && hasAlias,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Only retry once on failure
  });

  return {
    ...queryResult,
    hasAlias
  };
}