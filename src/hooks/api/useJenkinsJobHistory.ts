import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchJenkinsJobHistory, type JenkinsJobHistoryResponse } from '@/services/SelfServiceApi';

/**
 * Hook to fetch Jenkins job history with pagination, time filtering, and automatic polling
 * 
 * ENHANCED: Now automatically polls every 10 seconds when there are active jobs
 * (jobs with status 'queued' or 'running') to keep the UI updated in real-time.
 * Polling stops when all jobs reach terminal states OR after 10 polling attempts (100 seconds).
 * 
 * SAFETY LIMIT: Stops polling after 10 attempts to prevent infinite polling if a job gets stuck
 * 
 * @param limit - Number of jobs per page (default: 10)
 * @param offset - Offset for pagination
 * @param onlyMine - If true, fetch only current user's jobs (default: true)
 * @param lastUpdated - Number of hours to look back for job updates (default: 48)
 * 
 * @example
 * const { data, isLoading, refetch } = useJenkinsJobHistory(10, 0, true, 24);
 */
export function useJenkinsJobHistory(
  limit: number = 10,
  offset: number = 0,
  onlyMine: boolean = true,
  lastUpdated: number = 48
): UseQueryResult<JenkinsJobHistoryResponse, Error> {
  return useQuery({
    queryKey: queryKeys.selfService.jobHistory(limit, offset, onlyMine, lastUpdated),
    queryFn: () => fetchJenkinsJobHistory(limit, offset, onlyMine, lastUpdated),
    
    // Automatic polling configuration
    refetchInterval: (query) => {
      const data = query.state.data;
      
      // If no data yet, don't poll
      if (!data || !data.jobs || data.jobs.length === 0) {
        return false;
      }
      
      // Find active jobs (queued or pending)
      const activeJobs = data.jobs.filter(job => {
        const status = job.status?.toLowerCase();
        return status === 'queued' || status === 'pending';
      });
      
      // If no active jobs, stop polling
      if (activeJobs.length === 0) {
        return false;
      }
      
      // SAFETY LIMIT: Check if any active job has been polling for too long
      // Stop polling after 10 attempts (10 seconds × 10 attempts = 100 seconds)
      const now = Date.now();
      const maxPollingDuration = 100 * 1000; // 100 seconds
      
      const hasJobExceededLimit = activeJobs.some(job => {
        if (!job.lastPolledAt) return false;
        
        const polledAt = new Date(job.lastPolledAt).getTime();
        const elapsedTime = now - polledAt;
        
        // If job has been in active state for more than 100 seconds, stop polling
        return elapsedTime > maxPollingDuration;
      });
      
      if (hasJobExceededLimit) {
        console.log('[JobHistory] Polling limit reached (10 attempts). Stopping automatic polling.');
        return false;
      }
      
      // If there are active jobs and limit not exceeded, poll every 10 seconds
      return 10000;
    },
    
    // Continue polling even when browser tab is in background
    refetchIntervalInBackground: true,
    
    // Don't cache - always get fresh data
    staleTime: 0,
    gcTime: 0,
    
    // Don't refetch on window focus since we have automatic polling
    refetchOnWindowFocus: false,
    
    retry: 1,
  });
}