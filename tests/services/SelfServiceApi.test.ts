import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchJenkinsJobParameters,
  fetchAndPopulateDynamicSteps,
  triggerJenkinsJob,
  fetchJenkinsQueueStatus,
  fetchJenkinsBuildStatus,
  type JenkinsQueueStatusResponse,
  type JenkinsBuildStatusResponse
} from '../../src/services/SelfServiceApi';
import { apiClient } from '../../src/services/ApiClient';
import type { JenkinsJobParametersResponse, JenkinsJobField } from '../../src/types/api';

// Mock the ApiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('SelfServiceApi', () => {
  let mockJenkinsFields: JenkinsJobField[];
  let mockLegacyResponse: { parameterDefinitions: JenkinsJobField[] };

  beforeEach(() => {
    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock Jenkins job fields
    mockJenkinsFields = [
      {
        name: 'ENVIRONMENT',
        type: 'BooleanParameterDefinition',
        description: 'Target environment',
        defaultParameterValue: { value: true }
      },
      {
        name: 'VERSION',
        type: 'StringParameterDefinition',
        description: 'Version to deploy',
        defaultParameterValue: { value: '1.0.0' }
      },
      {
        name: 'DEPLOYMENT_TYPE',
        type: 'ExtendedChoiceParameterDefinition',
        description: 'Type of deployment',
        defaultParameterValue: { value: 'rolling' }
      },
      {
        name: 'NOTIFICATION_TYPE',
        type: 'PT_RADIO',
        description: 'Notification preferences',
        defaultParameterValue: { value: 'email' }
      }
    ];

    // Setup mock legacy response
    mockLegacyResponse = {
      parameterDefinitions: mockJenkinsFields
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // PARAMETER TYPE MAPPING & JENKINS JOB PARAMETERS
  // ============================================================================

  describe('fetchJenkinsJobParameters', () => {
    it('should fetch parameters and map types correctly', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockLegacyResponse);

      const result = await fetchJenkinsJobParameters('test-jaas', 'test-job');

      expect(result).toEqual({
        steps: [{
          name: 'parameters',
          fields: [
            {
              name: 'ENVIRONMENT',
              type: 'checkbox', // Mapped from BooleanParameterDefinition
              description: 'Target environment',
              defaultParameterValue: { value: true }
            },
            {
              name: 'VERSION',
              type: 'text', // Mapped from StringParameterDefinition
              description: 'Version to deploy',
              defaultParameterValue: { value: '1.0.0' }
            },
            {
              name: 'DEPLOYMENT_TYPE',
              type: 'select', // Mapped from ExtendedChoiceParameterDefinition
              description: 'Type of deployment',
              defaultParameterValue: { value: 'rolling' }
            },
            {
              name: 'NOTIFICATION_TYPE',
              type: 'radio', // Mapped from PT_RADIO
              description: 'Notification preferences',
              defaultParameterValue: { value: 'email' }
            }
          ]
        }]
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/test-job/parameters'
      );
    });

    it('should handle edge cases and errors', async () => {
      // Test empty parameter definitions
      vi.mocked(apiClient.get).mockResolvedValueOnce({ parameterDefinitions: [] });
      let result = await fetchJenkinsJobParameters('test-jaas', 'test-job');
      expect(result.steps[0].fields).toEqual([]);

      // Test missing parameterDefinitions property
      vi.mocked(apiClient.get).mockResolvedValueOnce({});
      result = await fetchJenkinsJobParameters('test-jaas', 'test-job');
      expect(result.steps[0].fields).toEqual([]);

      // Test parameters without default values
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        parameterDefinitions: [{
          name: 'PARAM_WITHOUT_DEFAULT',
          type: 'StringParameterDefinition',
          description: 'Parameter without default'
        }]
      });
      result = await fetchJenkinsJobParameters('test-jaas', 'test-job');
      expect(result.steps[0].fields![0]).toEqual({
        name: 'PARAM_WITHOUT_DEFAULT',
        type: 'text',
        description: 'Parameter without default'
      });

      // Test API errors
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Jenkins API error'));
      await expect(fetchJenkinsJobParameters('test-jaas', 'test-job')).rejects.toThrow('Jenkins API error');

      // Test unknown parameter types
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        parameterDefinitions: [{
          name: 'CUSTOM_PARAM',
          type: 'CustomParameterType',
          description: 'Custom parameter'
        }]
      });
      result = await fetchJenkinsJobParameters('test-jaas', 'test-job');
      expect(result.steps[0].fields![0].type).toBe('CustomParameterType');
    });
  });


  // ============================================================================
  // FETCH AND POPULATE DYNAMIC STEPS
  // ============================================================================

  describe('fetchAndPopulateDynamicSteps', () => {
    it('should populate dynamic steps with Jenkins parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockLegacyResponse);

      const inputSteps = [
        {
          name: 'basic-info',
          title: 'Basic Information',
          description: 'Enter basic deployment info',
          fields: [
            { name: 'app_name', type: 'text', description: 'Application name' }
          ]
        },
        {
          name: 'jenkins-params',
          title: 'Jenkins Parameters',
          description: 'Jenkins job parameters',
          isDynamic: true
        }
      ];

      const result = await fetchAndPopulateDynamicSteps('test-jaas', 'test-job', inputSteps);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0]).toEqual(inputSteps[0]); // Static step unchanged
      expect(result.steps[1]).toEqual({
        name: 'jenkins-params',
        title: 'Jenkins Parameters',
        description: 'Jenkins job parameters',
        isDynamic: true,
        fields: [
          {
            name: 'ENVIRONMENT',
            type: 'checkbox',
            description: 'Target environment',
            defaultParameterValue: { value: true }
          },
          {
            name: 'VERSION',
            type: 'text',
            description: 'Version to deploy',
            defaultParameterValue: { value: '1.0.0' }
          },
          {
            name: 'DEPLOYMENT_TYPE',
            type: 'select',
            description: 'Type of deployment',
            defaultParameterValue: { value: 'rolling' }
          },
          {
            name: 'NOTIFICATION_TYPE',
            type: 'radio',
            description: 'Notification preferences',
            defaultParameterValue: { value: 'email' }
          }
        ]
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/test-job/parameters'
      );
    });

    it('should return steps unchanged when no dynamic steps exist', async () => {
      const staticSteps = [
        {
          name: 'basic-info',
          title: 'Basic Information',
          fields: [
            { name: 'app_name', type: 'text', description: 'Application name' }
          ]
        },
        {
          name: 'advanced-config',
          title: 'Advanced Configuration',
          fields: [
            { name: 'timeout', type: 'number', description: 'Timeout in seconds' }
          ]
        }
      ];

      const result = await fetchAndPopulateDynamicSteps('test-jaas', 'test-job', staticSteps);

      expect(result.steps).toEqual(staticSteps);
      expect(apiClient.get).not.toHaveBeenCalled(); // Should not call API
    });

    it('should handle multiple dynamic steps', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockLegacyResponse);

      const inputSteps = [
        {
          name: 'step1',
          isDynamic: true
        },
        {
          name: 'step2',
          fields: [{ name: 'static_field', type: 'text' }]
        },
        {
          name: 'step3',
          isDynamic: true
        }
      ];

      const result = await fetchAndPopulateDynamicSteps('test-jaas', 'test-job', inputSteps);

      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].fields).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'ENVIRONMENT', type: 'checkbox' })
      ]));
      expect(result.steps[1]).toEqual(inputSteps[1]); // Static step unchanged
      expect(result.steps[2].fields).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'ENVIRONMENT', type: 'checkbox' })
      ]));

      expect(apiClient.get).toHaveBeenCalledTimes(1); // Should only fetch once
    });

    it('should handle API errors during dynamic step population', async () => {
      const apiError = new Error('Failed to fetch Jenkins parameters');
      vi.mocked(apiClient.get).mockRejectedValueOnce(apiError);

      const inputSteps = [
        { name: 'dynamic-step', isDynamic: true }
      ];

      await expect(fetchAndPopulateDynamicSteps('test-jaas', 'test-job', inputSteps))
        .rejects.toThrow('Failed to fetch Jenkins parameters');
    });

    it('should preserve step properties when populating dynamic steps', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ parameterDefinitions: [] });

      const inputSteps = [
        {
          name: 'dynamic-step',
          title: 'Dynamic Step Title',
          description: 'Dynamic step description',
          isDynamic: true,
          customProperty: 'custom-value'
        }
      ];

      const result = await fetchAndPopulateDynamicSteps('test-jaas', 'test-job', inputSteps);

      expect(result.steps[0]).toEqual({
        name: 'dynamic-step',
        title: 'Dynamic Step Title',
        description: 'Dynamic step description',
        isDynamic: true,
        customProperty: 'custom-value',
        fields: []
      });
    });
  });

  // ============================================================================
  // TRIGGER JENKINS JOB
  // ============================================================================

  describe('triggerJenkinsJob', () => {
    it('should trigger Jenkins job successfully', async () => {
      const mockTriggerResponse = {
        success: true,
        message: 'Job triggered successfully',
        queueItemId: '12345',
        queueUrl: 'https://jenkins.example.com/queue/item/12345',
        buildUrl: 'https://jenkins.example.com/job/test-job/123'
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockTriggerResponse);

      const parameters = {
        ENVIRONMENT: 'production',
        VERSION: '2.0.0',
        ENABLE_NOTIFICATIONS: true
      };

      const result = await triggerJenkinsJob('test-jaas', 'test-job', parameters);

      expect(result).toEqual(mockTriggerResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/test-job/trigger',
        parameters
      );
    });

    it('should handle job trigger failure', async () => {
      const mockFailureResponse = {
        success: false,
        message: 'Job trigger failed: Invalid parameters'
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockFailureResponse);

      const parameters = { INVALID_PARAM: 'value' };

      const result = await triggerJenkinsJob('test-jaas', 'test-job', parameters);

      expect(result).toEqual(mockFailureResponse);
    });

    it('should handle empty parameters', async () => {
      const mockResponse = {
        success: true,
        message: 'Job triggered with default parameters',
        queueItemId: '12346'
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await triggerJenkinsJob('test-jaas', 'test-job', {});

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/test-job/trigger',
        {}
      );
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Jenkins server unavailable');
      vi.mocked(apiClient.post).mockRejectedValueOnce(apiError);

      const parameters = { VERSION: '1.0.0' };

      await expect(triggerJenkinsJob('test-jaas', 'test-job', parameters))
        .rejects.toThrow('Jenkins server unavailable');
    });

    it('should handle complex parameter types', async () => {
      const mockResponse = {
        success: true,
        queueItemId: '12347'
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const complexParameters = {
        stringParam: 'test-value',
        booleanParam: true,
        numberParam: 42,
        arrayParam: ['item1', 'item2'],
        objectParam: { nested: 'value' }
      };

      const result = await triggerJenkinsJob('test-jaas', 'test-job', complexParameters);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/test-job/trigger',
        complexParameters
      );
    });
  });

  // ============================================================================
  // FETCH JENKINS QUEUE STATUS
  // ============================================================================

  describe('fetchJenkinsQueueStatus', () => {
    it('should fetch queue status successfully', async () => {
      const mockQueueStatus: JenkinsQueueStatusResponse = {
        status: 'queued',
        message: 'Job is waiting in queue',
        queueUrl: 'https://jenkins.example.com/queue/item/12345',
        jaasName: 'test-jaas',
        jobName: 'test-job',
        waitTime: 30000
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockQueueStatus);

      const result = await fetchJenkinsQueueStatus('test-jaas', '12345');

      expect(result).toEqual(mockQueueStatus);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/queue/12345/status'
      );
    });

    it('should handle running status', async () => {
      const mockRunningStatus: JenkinsQueueStatusResponse = {
        status: 'running',
        message: 'Job is currently running',
        buildNumber: 123,
        buildUrl: 'https://jenkins.example.com/job/test-job/123',
        jaasName: 'test-jaas',
        jobName: 'test-job'
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockRunningStatus);

      const result = await fetchJenkinsQueueStatus('test-jaas', '12345');

      expect(result).toEqual(mockRunningStatus);
      expect(result.buildNumber).toBe(123);
      expect(result.buildUrl).toBe('https://jenkins.example.com/job/test-job/123');
    });

    it('should handle completed status', async () => {
      const mockCompletedStatus: JenkinsQueueStatusResponse = {
        status: 'success',
        message: 'Job completed successfully',
        buildNumber: 123,
        buildUrl: 'https://jenkins.example.com/job/test-job/123',
        jaasName: 'test-jaas',
        jobName: 'test-job'
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockCompletedStatus);

      const result = await fetchJenkinsQueueStatus('test-jaas', '12345');

      expect(result).toEqual(mockCompletedStatus);
      expect(result.status).toBe('success');
    });

    it('should handle failed status', async () => {
      const mockFailedStatus: JenkinsQueueStatusResponse = {
        status: 'failed',
        message: 'Job execution failed',
        buildNumber: 123,
        buildUrl: 'https://jenkins.example.com/job/test-job/123',
        jaasName: 'test-jaas',
        jobName: 'test-job'
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockFailedStatus);

      const result = await fetchJenkinsQueueStatus('test-jaas', '12345');

      expect(result).toEqual(mockFailedStatus);
      expect(result.status).toBe('failed');
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Queue item not found');
      vi.mocked(apiClient.get).mockRejectedValueOnce(apiError);

      await expect(fetchJenkinsQueueStatus('test-jaas', '12345'))
        .rejects.toThrow('Queue item not found');
    });
  });

  // ============================================================================
  // FETCH JENKINS BUILD STATUS
  // ============================================================================

  describe('fetchJenkinsBuildStatus', () => {
    it('should fetch build status successfully', async () => {
      const mockBuildStatus: JenkinsBuildStatusResponse = {
        buildNumber: 123,
        buildUrl: 'https://jenkins.example.com/job/test-job/123',
        status: 'running',
        duration: 120000
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockBuildStatus);

      const result = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 123);

      expect(result).toEqual(mockBuildStatus);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/self-service/jenkins/test-jaas/test-job/123/status'
      );
    });

    it('should handle queued build status', async () => {
      const mockQueuedStatus: JenkinsBuildStatusResponse = {
        buildNumber: 124,
        buildUrl: 'https://jenkins.example.com/job/test-job/124',
        status: 'queued',
        queuedReason: 'Waiting for available executor',
        waitTime: 45000
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockQueuedStatus);

      const result = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 124);

      expect(result).toEqual(mockQueuedStatus);
      expect(result.queuedReason).toBe('Waiting for available executor');
      expect(result.waitTime).toBe(45000);
    });

    it('should handle successful build status', async () => {
      const mockSuccessStatus: JenkinsBuildStatusResponse = {
        buildNumber: 125,
        buildUrl: 'https://jenkins.example.com/job/test-job/125',
        status: 'success',
        duration: 300000
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockSuccessStatus);

      const result = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 125);

      expect(result).toEqual(mockSuccessStatus);
      expect(result.status).toBe('success');
      expect(result.duration).toBe(300000);
    });

    it('should handle failed build status', async () => {
      const mockFailedStatus: JenkinsBuildStatusResponse = {
        buildNumber: 126,
        buildUrl: 'https://jenkins.example.com/job/test-job/126',
        status: 'failed',
        duration: 180000
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockFailedStatus);

      const result = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 126);

      expect(result).toEqual(mockFailedStatus);
      expect(result.status).toBe('failed');
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Build not found');
      vi.mocked(apiClient.get).mockRejectedValueOnce(apiError);

      await expect(fetchJenkinsBuildStatus('test-jaas', 'test-job', 999))
        .rejects.toThrow('Build not found');
    });

    it('should handle build status without optional fields', async () => {
      const mockMinimalStatus: JenkinsBuildStatusResponse = {
        buildNumber: 127,
        buildUrl: 'https://jenkins.example.com/job/test-job/127',
        status: 'running'
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockMinimalStatus);

      const result = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 127);

      expect(result).toEqual(mockMinimalStatus);
      expect(result.duration).toBeUndefined();
      expect(result.waitTime).toBeUndefined();
      expect(result.queuedReason).toBeUndefined();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete job lifecycle', async () => {
      // 1. Fetch parameters
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockLegacyResponse);
      const parameters = await fetchJenkinsJobParameters('test-jaas', 'test-job');
      expect(parameters.steps[0].fields).toHaveLength(4);

      // 2. Trigger job
      const mockTriggerResponse = {
        success: true,
        queueItemId: '12345',
        queueUrl: 'https://jenkins.example.com/queue/item/12345'
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockTriggerResponse);
      const triggerResult = await triggerJenkinsJob('test-jaas', 'test-job', {
        ENVIRONMENT: true,
        VERSION: '1.0.0'
      });
      expect(triggerResult.success).toBe(true);

      // 3. Check queue status
      const mockQueueStatus: JenkinsQueueStatusResponse = {
        status: 'running',
        buildNumber: 123,
        buildUrl: 'https://jenkins.example.com/job/test-job/123'
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockQueueStatus);
      const queueStatus = await fetchJenkinsQueueStatus('test-jaas', '12345');
      expect(queueStatus.status).toBe('running');

      // 4. Check build status
      const mockBuildStatus: JenkinsBuildStatusResponse = {
        buildNumber: 123,
        buildUrl: 'https://jenkins.example.com/job/test-job/123',
        status: 'success',
        duration: 300000
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockBuildStatus);
      const buildStatus = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 123);
      expect(buildStatus.status).toBe('success');
    });

    it('should handle job failure scenario', async () => {
      // Trigger job
      const mockTriggerResponse = {
        success: true,
        queueItemId: '12346'
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockTriggerResponse);
      const triggerResult = await triggerJenkinsJob('test-jaas', 'test-job', {});
      expect(triggerResult.success).toBe(true);

      // Check failed queue status
      const mockFailedQueueStatus: JenkinsQueueStatusResponse = {
        status: 'failed',
        message: 'Job execution failed',
        buildNumber: 124,
        buildUrl: 'https://jenkins.example.com/job/test-job/124'
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockFailedQueueStatus);
      const queueStatus = await fetchJenkinsQueueStatus('test-jaas', '12346');
      expect(queueStatus.status).toBe('failed');

      // Check failed build status
      const mockFailedBuildStatus: JenkinsBuildStatusResponse = {
        buildNumber: 124,
        buildUrl: 'https://jenkins.example.com/job/test-job/124',
        status: 'failed',
        duration: 60000
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockFailedBuildStatus);
      const buildStatus = await fetchJenkinsBuildStatus('test-jaas', 'test-job', 124);
      expect(buildStatus.status).toBe('failed');
    });
  });
});
