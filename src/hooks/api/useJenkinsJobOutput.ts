import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import type { AxiosResponse } from 'axios';

export interface JobOutputResponse {
    success?: boolean;
    data?: any;
    error?: string;
    message?: string;
}

/**
 * Fetch job output for a specific Jenkins build
 * 
 * @param jaasName - Jenkins JAAS name (e.g., "atom")
 * @param jobName - Jenkins job name (e.g., "hello-deverloper-portal")
 * @param buildNumber - Build number (e.g., 31)
 * @param enabled - Whether to enable the query (default: false)
 */
export function useJenkinsJobOutput(
    jaasName: string,
    jobName: string,
    buildNumber: number,
    enabled: boolean = false
) {
    return useQuery<any, Error>({
        queryKey: ['jenkins-job-output', jaasName, jobName, buildNumber],
        queryFn: async () => {
            try {
                const url = `/self-service/jenkins/${jaasName}/${jobName}/${buildNumber}/output`;
                const response: AxiosResponse<any> = await apiClient.get(url);
                return response ?? {};
            } catch (error: any) {
                throw new Error(
                    error.response?.message ||
                    error.message ||
                    'Failed to fetch job output'
                );
            }
        },
        enabled: enabled && !!jaasName && !!jobName && !!buildNumber,
        staleTime: 30000, // Cache for 30 seconds
        retry: 1, // Only retry once on failure
    });
}