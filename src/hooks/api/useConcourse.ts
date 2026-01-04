import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchConcourseJobs } from '@/services/concourseApi';
import type { ConcourseJobsResponse, ConcourseJob } from '@/types/concourse';

interface UseConcourseOptions {
  landscape?: string;
  enabled?: boolean;
}

interface UseConcourseResult {
  jobs: ConcourseJob[];
  jobsByLandscape: ConcourseJobsResponse;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch Concourse jobs data from Jenkins
 * @param options - Configuration options
 * @param options.landscape - Optional landscape filter (e.g., 'cf-ae01'). Omit or use 'all' for all landscapes
 * @param options.enabled - Whether the query should run automatically. Defaults to true
 * @returns Object containing jobs data, loading state, and error
 */
export function useConcourse(options: UseConcourseOptions = {}): UseConcourseResult {
  const { landscape = 'all', enabled = true } = options;

  const queryResult = useQuery<ConcourseJobsResponse, Error>({
    queryKey: ['concourse', 'jobs', landscape],
    queryFn: async () => {
      const response = await fetchConcourseJobs(landscape);
      return response;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (Concourse data updates frequently)
    retry: 2, // Retry twice on failure
  });

  // Flatten jobs from all landscapes into a single array
  const jobs: ConcourseJob[] = [];
  if (queryResult.data) {
    Object.values(queryResult.data).forEach((landscapeJobs) => {
      if (Array.isArray(landscapeJobs)) {
        jobs.push(...landscapeJobs);
      }
    });
  }

  return {
    jobs,
    jobsByLandscape: queryResult.data || {},
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
