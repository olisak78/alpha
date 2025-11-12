import { useMutation } from '@tanstack/react-query';
import { triggerJenkinsJob } from '@/services/SelfServiceApi';

interface TriggerJenkinsJobParams {
  jaasName: string;
  jobName: string;
  parameters: Record<string, any>;
}

/**
 * Hook to trigger a Jenkins job with parameters
 */
export const useTriggerJenkinsJob = () => {
  return useMutation({
    mutationFn: ({ jaasName, jobName, parameters }: TriggerJenkinsJobParams) =>
      triggerJenkinsJob(jaasName, jobName, parameters),
    onSuccess: (data) => {
      console.log('Jenkins job triggered successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to trigger Jenkins job:', error);
    },
  });
};
