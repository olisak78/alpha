import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { safeSessionStorageGet, safeSessionStorageSet } from '@/hooks/useSessionState';

/**
 * Job status interface with buildNumber, waitTime and duration added
 * - waitTime: Wait time in milliseconds from queue status endpoint (for queued/pending jobs)
 * - duration: Build duration in milliseconds from build status endpoint (for running/aborted/completed jobs)
 */
export interface Job {
  status: string;
  message: string;
  queueUrl: string;
  queueItemId: string;
  baseJobUrl: string;
  jobName: string;
  jaasName: string;
  buildNumber?: number; // Added for displaying build number in UI
  waitTime?: number; // Wait time in milliseconds for queued/pending jobs from queue status endpoint
  duration?: number; // Build duration in milliseconds for running/aborted/completed jobs from build status endpoint
  timestamp?: number; // For sorting/tracking
}

const JOB_STATUS_SESSION_KEY = 'selfService:jobStatus';

/**
 * Helper function to get jobs from sessionStorage
 */
function getJobsFromSession(): Job[] {
  return safeSessionStorageGet<Job[]>(JOB_STATUS_SESSION_KEY, []);
}

/**
 * Helper function to save jobs to sessionStorage
 */
function saveJobsToSession(jobs: Job[]): void {
  safeSessionStorageSet(JOB_STATUS_SESSION_KEY, jobs);
}

/**
 * React Query hook to fetch job status
 */
export function useJobStatus(
  options?: Omit<UseQueryOptions<Job[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.selfService.jobStatus(),
    queryFn: () => {
      return Promise.resolve(getJobsFromSession());
    },
    staleTime: 1000 * 60,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...options,
  });
}

/**
 * Mutation hook to add a new job to the status list
 */
export function useAddJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newJob: Omit<Job, 'timestamp'>) => {
      const jobWithTimestamp: Job = {
        ...newJob,
        timestamp: Date.now(),
      };

      const currentJobs = getJobsFromSession();
      const updatedJobs = [jobWithTimestamp, ...currentJobs];
      const limitedJobs = updatedJobs.slice(0, 20);
      
      saveJobsToSession(limitedJobs);
      
      return limitedJobs;
    },
    onSuccess: (updatedJobs) => {
      queryClient.setQueryData(queryKeys.selfService.jobStatus(), updatedJobs);
    },
  });
}

/**
 * Mutation hook to update an existing job status
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ queueItemId, updates }: { queueItemId: string; updates: Partial<Job> }) => {
      const currentJobs = getJobsFromSession();
      
      const updatedJobs = currentJobs.map((job) =>
        job.queueItemId === queueItemId ? { ...job, ...updates } : job
      );
      
      saveJobsToSession(updatedJobs);
      
      return updatedJobs;
    },
    onSuccess: (updatedJobs) => {
      queryClient.setQueryData(queryKeys.selfService.jobStatus(), updatedJobs);
    },
  });
}

/**
 * Mutation hook to remove a job from the status list
 */
export function useRemoveJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueItemId: string) => {
      const currentJobs = getJobsFromSession();
      const updatedJobs = currentJobs.filter((job) => job.queueItemId !== queueItemId);
      
      saveJobsToSession(updatedJobs);
      
      return updatedJobs;
    },
    onSuccess: (updatedJobs) => {
      queryClient.setQueryData(queryKeys.selfService.jobStatus(), updatedJobs);
    },
  });
}

/**
 * Mutation hook to clear all jobs
 */
export function useClearJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      saveJobsToSession([]);
      return [];
    },
    onSuccess: (updatedJobs) => {
      queryClient.setQueryData(queryKeys.selfService.jobStatus(), updatedJobs);
    },
  });
}