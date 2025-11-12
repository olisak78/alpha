import { useEffect, useRef, useState } from 'react';
import { useJenkinsQueueStatus } from '@/hooks/api/useJenkinsQueueStatus';
import { useJenkinsBuildStatus } from '@/hooks/api/useJenkinsBuildStatus';
import { useUpdateJobStatus } from '@/hooks/api/useJobStatus';

interface JobStatusPollerProps {
  jaasName: string;
  queueItemId: string;
  jobName: string;
  onComplete?: () => void;
}

/**
 * Component that polls a single Jenkins job status and updates the job status list
 * 
 * LOGIC:
 * 1. Poll queue status endpoint until buildNumber is not null
 * 2. Once buildNumber is available, store the queue response and stop queue polling
 * 3. Start polling build status endpoint with jaasName, jobName, buildNumber
 * 4. Update job status from build status endpoint
 * 5. Stop all polling when terminal state is reached
 */
export function JobStatusPoller({ jaasName, queueItemId, jobName, onComplete }: JobStatusPollerProps) {
  const updateJobMutation = useUpdateJobStatus();
  const [queueResponse, setQueueResponse] = useState<any>(null);
  const [buildNumber, setBuildNumber] = useState<number | null>(null);
  const hasCompletedRef = useRef(false);
  const lastUpdateRef = useRef<string>('');
    
  // Step 1: Poll queue status until buildNumber is available
  const queueEnabled = !buildNumber && !hasCompletedRef.current;
  
  const { data: queueStatus, error: queueError, isLoading: queueLoading, isFetching: queueFetching } = useJenkinsQueueStatus(jaasName, queueItemId, {
    enabled: queueEnabled,
  });
  
  // Step 3: Once buildNumber is available, poll build status
  const { data: buildStatus, error: buildError, isLoading: buildLoading, isFetching: buildFetching } = useJenkinsBuildStatus(
    jaasName, 
    jobName, 
    buildNumber || 0,
    {
      enabled: buildNumber !== null && !hasCompletedRef.current,
    }
  );
  
  // Log errors
  useEffect(() => {
    if (queueError) {
      console.error(`[JobStatusPoller] Queue status error:`, queueError);
    }
  }, [queueError]);

  useEffect(() => {
    if (buildError) {
      console.error(`[JobStatusPoller] Build status error:`, buildError);
    }
  }, [buildError]);

  // Step 2: Monitor queue status for buildNumber
  useEffect(() => {
    if (queueStatus && queueStatus.buildNumber && !buildNumber) {
      setQueueResponse(queueStatus);
      setBuildNumber(queueStatus.buildNumber);
    }
  }, [queueStatus, buildNumber]);

  // Update job status from queue polling (before buildNumber is available)
  useEffect(() => {
    if (queueStatus && !buildNumber && !hasCompletedRef.current) {
      // Create a unique key for this update to prevent duplicates
      const updateKey = `queue-${queueStatus.status}-${queueStatus.buildUrl}-${queueStatus.buildNumber}-${queueStatus.waitTime}`;
      
      if (lastUpdateRef.current === updateKey) {
        return;
      }
      
      lastUpdateRef.current = updateKey;
      
      // If buildUrl is available (not null and not empty), use it as queueUrl to make job clickable
      const jobUrl = (queueStatus.buildUrl && queueStatus.buildUrl.trim() !== '') 
        ? queueStatus.buildUrl 
        : queueStatus.queueUrl || undefined;
      
      
      updateJobMutation.mutate(
        {
          queueItemId,
          updates: {
            status: queueStatus.status,
            message: queueStatus.message || `Job ${queueStatus.status}`,
            queueUrl: jobUrl,
            buildNumber: queueStatus.buildNumber || undefined,
            waitTime: queueStatus.waitTime, // Store waitTime from queue status endpoint
          },
        },
        {
          onError: (error) => {
            console.error(`[JobStatusPoller] Failed to update job status:`, error);
          },
          onSuccess: () => {
            console.log(`[JobStatusPoller] Job status updated successfully from queue endpoint`);
          }
        }
      );
    }
  }, [queueStatus, buildNumber, queueItemId, updateJobMutation]);

  // Step 4: Update job status from build polling (after buildNumber is available)
  useEffect(() => {
    if (buildStatus && buildNumber && !hasCompletedRef.current) {
      
      updateJobMutation.mutate({
        queueItemId,
        updates: {
          status: buildStatus.status,
          message: buildStatus.queuedReason || `Build #${buildNumber} ${buildStatus.status}`,
          queueUrl: buildStatus.buildUrl || undefined,
          buildNumber: buildNumber,
          duration: buildStatus.duration, // Store duration from build status endpoint
        },
      });

      // Step 5: Check if job reached terminal state
      const terminalStates = ['success', 'failed', 'aborted', 'cancelled', 'error'];
      if (terminalStates.includes(buildStatus.status?.toLowerCase())) {
        hasCompletedRef.current = true;
        onComplete?.();
      }
    }
  }, [buildStatus, buildNumber, queueItemId, updateJobMutation, onComplete]);

  return null;
}