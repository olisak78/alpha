import { useQuery } from '@tanstack/react-query';
import { fetchJenkinsJobOutput, type JenkinsJobOutputItem } from '@/services/SelfServiceApi';

/**
 * Hook to fetch Jenkins job output
 */
export const useJenkinsJobOutput = (
  jaasName: string | undefined,
  jobName: string | undefined,
  buildNumber: number | undefined,
  enabled: boolean = true
) => {
  return useQuery<JenkinsJobOutputItem[], Error>({
    queryKey: ['jenkinsJobOutput', jaasName, jobName, buildNumber],
    queryFn: async () => {
      if (!jaasName || !jobName || buildNumber === undefined) {
        return [];
      }
      return fetchJenkinsJobOutput(jaasName, jobName, buildNumber);
    },
    enabled: enabled && !!jaasName && !!jobName && buildNumber !== undefined,
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on error - just hide the section
  });
};