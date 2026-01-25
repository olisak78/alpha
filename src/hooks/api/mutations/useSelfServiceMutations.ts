import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerJenkinsJob } from '@/services/SelfServiceApi';
import { queryKeys } from '@/lib/queryKeys';

interface TriggerJenkinsJobParams {
  jaasName: string;
  jobName: string;
  parameters: Record<string, any>;
}

/**
 * Hook to trigger a Jenkins job with parameters
 */
export const useTriggerJenkinsJob = () => {
  const queryClient = useQueryClient();   

  return useMutation({
    mutationFn: ({ jaasName, jobName, parameters }: TriggerJenkinsJobParams) =>
      triggerJenkinsJob(jaasName, jobName, parameters),
    onSuccess: (data) => {
      console.log('Jenkins job triggered successfully:', data); 

      queryClient.invalidateQueries({
        queryKey: queryKeys.selfService.all,
      });
    },
    onError: (error) => {
      console.error('Failed to trigger Jenkins job:', error);
    },
  });
};
