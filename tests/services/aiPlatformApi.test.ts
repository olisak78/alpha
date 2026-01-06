import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  aiApiClient,
  aiAuthManager,
  useAIAuth,
  useDeployments,
  useCreateDeployment,
  useCreateConfiguration,
  useFoundationModels,
  useStopDeployment,
  useDeleteDeployment,
  useChatInference,
  useUploadFiles,
  type Deployment,
  type DeploymentList,
  type CreateDeploymentRequest,
  type Configuration,
  type FoundationModel,
  type ModelsResponse,
  type ChatInferenceRequest,
  type ChatInferenceResponse,
  type UploadFilesResponse,
} from '../../src/services/aiPlatformApi';
import { apiClient } from '../../src/services/ApiClient';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the ApiClient
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    hasToken: vi.fn(),
    getToken: vi.fn(),
  },
}));

// Mock the constants
vi.mock('@/constants/developer-portal', () => ({
  getNewBackendUrl: vi.fn(() => 'http://localhost:7008'),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('aiPlatformApi', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to create wrapper with QueryClient
  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  // Helper functions to create mock data
  const createMockDeployment = (overrides?: Partial<Deployment>): Deployment => ({
    id: 'deployment-123',
    status: 'RUNNING',
    configurationId: 'config-123',
    configurationName: 'Test Configuration',
    executableId: 'exec-123',
    scenarioId: 'foundation-models',
    deploymentUrl: 'https://api.example.com/v1/deployments/deployment-123',
    statusMessage: 'Deployment is running successfully',
    ttl: '24h',
    createdAt: '2024-01-01T10:00:00Z',
    modifiedAt: '2024-01-01T10:30:00Z',
    startTime: '2024-01-01T10:05:00Z',
    submissionTime: '2024-01-01T10:00:00Z',
    targetStatus: 'RUNNING',
    lastOperation: 'CREATE',
    latestRunningConfigurationId: 'config-123',
    team: 'ai-team',
    details: {
      resources: {
        backendDetails: {
          model: {
            name: 'gpt-4',
            version: '1.0',
          },
        },
      },
      scaling: {
        backendDetails: {},
      },
    },
    ...overrides,
  });

  const createMockFoundationModel = (overrides?: Partial<FoundationModel>): FoundationModel => ({
    id: 'model-123',
    model: 'gpt-4',
    displayName: 'GPT-4',
    provider: 'OpenAI',
    description: 'Advanced language model',
    executableId: 'exec-123',
    accessType: 'public',
    versions: [
      {
        name: '1.0',
        isLatest: true,
        capabilities: ['text-generation', 'chat'],
        contextLength: 8192,
        cost: [
          {
            inputCost: '0.03',
            outputCost: '0.06',
            tier: 'standard',
            tierDescription: 'Standard pricing',
          },
        ],
        inputTypes: ['text'],
        streamingSupported: true,
        deprecated: false,
      },
    ],
    latestVersion: {
      name: '1.0',
      isLatest: true,
      capabilities: ['text-generation', 'chat'],
      contextLength: 8192,
    },
    capabilities: ['text-generation', 'chat'],
    contextLength: 8192,
    tags: ['language-model', 'chat'],
    scenarioId: 'foundation-models',
    allowedScenarios: [
      {
        executableId: 'exec-123',
        scenarioId: 'foundation-models',
      },
    ],
    ...overrides,
  });

  describe('aiApiClient', () => {
    describe('getDeployments', () => {
      it('should fetch deployments with and without parameters', async () => {
        const mockResponse: DeploymentList = {
          count: 1,
          deployments: [
            {
              team: 'ai-team',
              deployments: [createMockDeployment()],
            },
          ],
        };

        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        // Test without parameters
        const result1 = await aiApiClient.getDeployments();
        expect(apiClient.get).toHaveBeenCalledWith('/ai-core/deployments', {
          params: {},
        });
        expect(result1).toEqual(mockResponse);

        // Test with parameters
        const result2 = await aiApiClient.getDeployments({
          status: 'RUNNING',
          top: 50,
        });
        expect(apiClient.get).toHaveBeenCalledWith('/ai-core/deployments', {
          params: {
            status: 'RUNNING',
            top: 50,
          },
        });
        expect(result2).toEqual(mockResponse);
      });
    });

    describe('createDeployment', () => {
      it('should create deployment', async () => {
        const mockRequest: CreateDeploymentRequest = {
          configurationRequest: {
            executableId: 'exec-123',
            name: 'Test Deployment',
            parameterBindings: [
              { key: 'modelName', value: 'gpt-4' },
              { key: 'modelVersion', value: '1.0' },
            ],
            scenarioId: 'foundation-models',
          },
        };

        const mockResponse = { id: 'deployment-123' };
        vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

        const result = await aiApiClient.createDeployment(mockRequest);

        expect(apiClient.post).toHaveBeenCalledWith('/ai-core/deployments', mockRequest);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('createConfiguration', () => {
      it('should create configuration with default and custom model version', async () => {
        const mockConfiguration: Configuration = {
          id: 'config-123',
          name: 'gpt-4_1234567890',
          createdAt: '2024-01-01T10:00:00Z',
          executableId: 'exec-123',
          scenarioId: 'foundation-models',
          parameterBindings: [
            { key: 'modelName', value: 'gpt-4' },
            { key: 'modelVersion', value: '1.0' },
          ],
          inputArtifactBindings: [],
        };

        vi.mocked(apiClient.post).mockResolvedValue(mockConfiguration);

        // Test with custom version
        await aiApiClient.createConfiguration('gpt-4', 'exec-123', '1.0');
        expect(apiClient.post).toHaveBeenCalledWith('/ai-core/configurations', {
          name: expect.stringMatching(/^gpt-4_\d+$/),
          executableId: 'exec-123',
          scenarioId: 'foundation-models',
          parameterBindings: [
            { key: 'modelName', value: 'gpt-4' },
            { key: 'modelVersion', value: '1.0' },
          ],
          inputArtifactBindings: [],
        });

        // Test with default version
        await aiApiClient.createConfiguration('gpt-4', 'exec-123');
        expect(apiClient.post).toHaveBeenCalledWith('/ai-core/configurations', {
          name: expect.stringMatching(/^gpt-4_\d+$/),
          executableId: 'exec-123',
          scenarioId: 'foundation-models',
          parameterBindings: [
            { key: 'modelName', value: 'gpt-4' },
            { key: 'modelVersion', value: '1' },
          ],
          inputArtifactBindings: [],
        });
      });
    });

    describe('getAllFoundationModels', () => {
      it('should fetch foundation models with and without parameters', async () => {
        const mockResponse: ModelsResponse = {
          count: 1,
          totalCount: 1,
          resources: [createMockFoundationModel()],
          providers: ['OpenAI'],
          capabilities: ['text-generation', 'chat'],
        };

        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        // Test without parameters
        const result1 = await aiApiClient.getAllFoundationModels();
        expect(apiClient.get).toHaveBeenCalledWith('/ai-core/models', {
          params: {
            scenarioId: 'foundation-models',
          },
        });
        expect(result1).toEqual(mockResponse);

        // Test with parameters
        const result2 = await aiApiClient.getAllFoundationModels({
          search: 'gpt',
          provider: 'OpenAI',
        });
        expect(apiClient.get).toHaveBeenCalledWith('/ai-core/models', {
          params: {
            scenarioId: 'foundation-models',
            search: 'gpt',
            provider: 'OpenAI',
          },
        });
        expect(result2).toEqual(mockResponse);
      });
    });
  });

  describe('aiAuthManager', () => {
    it('should handle token management', () => {
      // Test stored credentials
      expect(aiAuthManager.getStoredCredentials()).toBeNull();

      // Test token when apiClient has token
      vi.mocked(apiClient.hasToken).mockReturnValue(true);
      expect(aiAuthManager.getToken()).toBe('managed-by-api-client');

      // Test token when apiClient has no token
      vi.mocked(apiClient.hasToken).mockReturnValue(false);
      expect(aiAuthManager.getToken()).toBeNull();
    });
  });

  describe('useAIAuth', () => {
    it('should return authenticated state when token exists', async () => {
      vi.mocked(apiClient.hasToken).mockReturnValue(true);
      vi.mocked(apiClient.get).mockResolvedValue({
        count: 1,
        deployments: [],
        tenant: 'test-tenant',
      });

      const { result } = renderHook(() => useAIAuth(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        isAuthenticated: true,
        tenantId: 'test-tenant',
        credentials: null,
      });
    });

  });

  describe('useDeployments', () => {
    it('should fetch deployments successfully', async () => {
      const mockResponse: DeploymentList = {
        count: 1,
        deployments: [
          {
            team: 'ai-team',
            deployments: [createMockDeployment()],
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeployments(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/ai-core/deployments', {
        params: { top: 100 },
      });
    });
  });

  describe('useCreateDeployment', () => {
    it('should create deployment and invalidate queries', async () => {
      const mockResponse = { id: 'deployment-123' };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateDeployment(), {
        wrapper: createWrapper,
      });

      const configurationRequest = {
        executableId: 'exec-123',
        name: 'Test Deployment',
        parameterBindings: [{ key: 'modelName', value: 'gpt-4' }],
        scenarioId: 'foundation-models',
      };

      const createDeploymentRequest = {
        configurationRequest,
      };

      result.current.mutate(createDeploymentRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/ai-core/deployments', createDeploymentRequest);
    });
  });

  describe('useChatInference', () => {
    it('should perform non-streaming chat inference', async () => {
      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [
          { role: 'user', content: 'Hello, how are you?' },
        ],
        max_tokens: 100,
        temperature: 0.7,
        stream: false,
      };

      const mockResponse: ChatInferenceResponse = {
        id: 'chat-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello! I am doing well, thank you for asking.' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/ai-core/chat/inference', mockRequest);
    });

    it('should handle streaming chat inference', async () => {
      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
        onChunk: vi.fn(),
      };

      // Mock streaming response
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      };

      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue(mockStreamResponse as any);

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7008/api/v1/ai-core/chat/inference',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify(mockRequest),
        })
      );
    });
  });

  describe('useUploadFiles', () => {
    it('should upload files successfully', async () => {
      const mockFiles = [
        new File(['test content'], 'test.txt', { type: 'text/plain' }),
      ];

      const mockResponse: UploadFilesResponse = {
        files: [
          {
            url: 'data:text/plain;base64,dGVzdCBjb250ZW50',
            mimeType: 'text/plain',
            filename: 'test.txt',
            size: 12,
          },
        ],
        count: 1,
        totalSize: 12,
      };

      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const { result } = renderHook(() => useUploadFiles(), {
        wrapper: createWrapper,
      });

      result.current.mutate(mockFiles);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:7008/api/v1/ai-core/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
          body: expect.any(FormData),
        })
      );
    });
  });


  describe('useAIAuth error scenarios', () => {
    it('should handle API errors gracefully when authenticated', async () => {
      vi.mocked(apiClient.hasToken).mockReturnValue(true);
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useAIAuth(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        isAuthenticated: true,
        tenantId: 'unknown',
        credentials: null,
      });
    });

    it('should extract tenant ID from tenantId field', async () => {
      vi.mocked(apiClient.hasToken).mockReturnValue(true);
      vi.mocked(apiClient.get).mockResolvedValue({
        count: 0,
        deployments: [],
        tenantId: 'tenant-from-tenantId',
      });

      const { result } = renderHook(() => useAIAuth(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.tenantId).toBe('tenant-from-tenantId');
    });

    it('should extract tenant ID from tenant_id field', async () => {
      vi.mocked(apiClient.hasToken).mockReturnValue(true);
      vi.mocked(apiClient.get).mockResolvedValue({
        count: 0,
        deployments: [],
        tenant_id: 'tenant-from-tenant_id',
      });

      const { result } = renderHook(() => useAIAuth(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.tenantId).toBe('tenant-from-tenant_id');
    });
  });

  describe('useDeployments error handling', () => {
    it('should handle forceRefresh parameter', async () => {
      const mockResponse: DeploymentList = {
        count: 0,
        deployments: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeployments(true), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useCreateDeployment error handling', () => {
    it('should handle creation errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateDeployment(), {
        wrapper: createWrapper,
      });

      const configurationRequest = {
        executableId: 'exec-123',
        name: 'Test Deployment',
        parameterBindings: [{ key: 'modelName', value: 'gpt-4' }],
        scenarioId: 'foundation-models',
      };

      const createDeploymentRequest = {
        configurationRequest,
      };

      result.current.mutate(createDeploymentRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Creation failed'));
    });
  });

  describe('useCreateConfiguration', () => {
    it('should create configuration successfully', async () => {
      const mockConfiguration: Configuration = {
        id: 'config-123',
        name: 'gpt-4_1234567890',
        createdAt: '2024-01-01T10:00:00Z',
        executableId: 'exec-123',
        scenarioId: 'foundation-models',
        parameterBindings: [
          { key: 'modelName', value: 'gpt-4' },
          { key: 'modelVersion', value: '1.0' },
        ],
        inputArtifactBindings: [],
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockConfiguration);

      const { result } = renderHook(() => useCreateConfiguration(), {
        wrapper: createWrapper,
      });

      result.current.mutate({
        modelName: 'gpt-4',
        executableId: 'exec-123',
        modelVersion: '1.0',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConfiguration);
    });

    it('should handle creation errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Configuration creation failed'));

      const { result } = renderHook(() => useCreateConfiguration(), {
        wrapper: createWrapper,
      });

      result.current.mutate({
        modelName: 'gpt-4',
        executableId: 'exec-123',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Configuration creation failed'));
    });
  });

  describe('useFoundationModels', () => {
    it('should fetch foundation models successfully', async () => {
      const mockResponse: ModelsResponse = {
        count: 1,
        totalCount: 1,
        resources: [createMockFoundationModel()],
        providers: ['OpenAI'],
        capabilities: ['text-generation'],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFoundationModels(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it('should fetch foundation models with parameters', async () => {
      const mockResponse: ModelsResponse = {
        count: 1,
        totalCount: 1,
        resources: [createMockFoundationModel()],
        providers: ['OpenAI'],
        capabilities: ['text-generation'],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const params = { search: 'gpt', provider: 'OpenAI' };
      const { result } = renderHook(() => useFoundationModels(params), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.get).toHaveBeenCalledWith('/ai-core/models', {
        params: {
          scenarioId: 'foundation-models',
          search: 'gpt',
          provider: 'OpenAI',
        },
      });
    });

    it('should handle API errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Models fetch failed'));

      const { result } = renderHook(() => useFoundationModels(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Models fetch failed'));
    });
  });

  describe('useStopDeployment', () => {
    it('should stop deployment successfully', async () => {
      const mockResponse = { message: 'Deployment stopped' };
      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStopDeployment(), {
        wrapper: createWrapper,
      });

      result.current.mutate('deployment-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.patch).toHaveBeenCalledWith('/ai-core/deployments/deployment-123', {
        targetStatus: 'STOPPED',
      });
    });

    it('should handle stop errors', async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('Stop failed'));

      const { result } = renderHook(() => useStopDeployment(), {
        wrapper: createWrapper,
      });

      result.current.mutate('deployment-123');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Stop failed'));
    });
  });

  describe('useDeleteDeployment', () => {
    it('should delete deployment successfully', async () => {
      const mockResponse = { message: 'Deployment deleted' };
      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteDeployment(), {
        wrapper: createWrapper,
      });

      result.current.mutate('deployment-123');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.delete).toHaveBeenCalledWith('/ai-core/deployments/deployment-123');
    });

    it('should handle delete errors', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteDeployment(), {
        wrapper: createWrapper,
      });

      result.current.mutate('deployment-123');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Delete failed'));
    });
  });

  describe('useChatInference error handling', () => {
    it('should handle non-streaming inference errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Inference failed'));

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      };

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Inference failed'));
    });

    it('should handle streaming inference errors', async () => {
      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Streaming failed' }),
      } as any);

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      };

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Streaming failed'));
    });

    it('should handle streaming with null response body', async () => {
      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      } as any);

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      };

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Response body is null'));
    });

    it('should handle streaming with Anthropic format', async () => {
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      };

      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue(mockStreamResponse as any);

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      const onChunk = vi.fn();
      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
        onChunk,
      };

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onChunk).toHaveBeenCalledWith('Hello');
    });
  });

  describe('useUploadFiles error handling', () => {
    it('should handle upload errors', async () => {
      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' }),
      } as any);

      const { result } = renderHook(() => useUploadFiles(), {
        wrapper: createWrapper,
      });

      const mockFiles = [
        new File(['test content'], 'test.txt', { type: 'text/plain' }),
      ];

      result.current.mutate(mockFiles);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Upload failed'));
    });
  });

  describe('Integration Tests', () => {
    it('should handle full deployment lifecycle', async () => {
      const deploymentId = 'deployment-123';

      // Create deployment
      const createResponse = { id: deploymentId };
      vi.mocked(apiClient.post).mockResolvedValueOnce(createResponse);

      const createRequest: CreateDeploymentRequest = {
        configurationRequest: {
          executableId: 'exec-123',
          name: 'Test Deployment',
          parameterBindings: [{ key: 'modelName', value: 'gpt-4' }],
          scenarioId: 'foundation-models',
        },
      };

      const created = await aiApiClient.createDeployment(createRequest);
      expect(created.id).toBe(deploymentId);

      // Get deployment status
      const runningDeployment = createMockDeployment({ id: deploymentId, status: 'RUNNING' });
      vi.mocked(apiClient.get).mockResolvedValueOnce(runningDeployment);

      const status = await aiApiClient.getDeployment(deploymentId);
      expect(status.status).toBe('RUNNING');

      // Stop deployment
      const stopResponse = { message: 'Deployment stopped' };
      vi.mocked(apiClient.patch).mockResolvedValueOnce(stopResponse);

      const stopped = await aiApiClient.stopDeployment(deploymentId);
      expect(stopped.message).toBe('Deployment stopped');

      // Delete deployment
      const deleteResponse = { message: 'Deployment deleted' };
      vi.mocked(apiClient.delete).mockResolvedValueOnce(deleteResponse);

      const deleted = await aiApiClient.deleteDeployment(deploymentId);
      expect(deleted.message).toBe('Deployment deleted');
    });

    it('should handle complex streaming scenarios', async () => {
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"id":"chat-123","model":"gpt-4","choices":[{"delta":{"content":"Hello"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"choices":[{"finish_reason":"stop"}],"usage":{"total_tokens":10}}\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n'),
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined,
              }),
            releaseLock: vi.fn(),
          }),
        },
      };

      vi.mocked(apiClient.getToken).mockResolvedValue('test-token');
      mockFetch.mockResolvedValue(mockStreamResponse as any);

      const { result } = renderHook(() => useChatInference(), {
        wrapper: createWrapper,
      });

      const onChunk = vi.fn();
      const mockRequest: ChatInferenceRequest = {
        deploymentId: 'deployment-123',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
        onChunk,
      };

      result.current.mutate(mockRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(onChunk).toHaveBeenCalledWith('Hello world');
      expect(result.current.data?.id).toBe('chat-123');
      expect(result.current.data?.model).toBe('gpt-4');
      expect(result.current.data?.usage?.total_tokens).toBe(10);
    });
  });
});
