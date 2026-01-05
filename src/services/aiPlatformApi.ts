import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNewBackendUrl } from "@/constants/developer-portal";

// Types from the original Angular service
export interface Deployment {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'DEAD' | 'STOPPING' | 'STOPPED' | 'UNKNOWN' | 'DELETING';
  configurationId: string;
  configurationName?: string;
  executableId?: string;
  scenarioId?: string;
  deploymentUrl?: string;
  statusMessage?: string;
  ttl?: string;
  createdAt: string;
  modifiedAt: string;
  startTime?: string;
  submissionTime?: string;
  targetStatus?: string;
  lastOperation?: string;
  latestRunningConfigurationId?: string;
  team?: string; // Add team field to deployment
  details?: {
    resources?: {
      backendDetails?: {
        model?: {
          name?: string;
          version?: string;
        };
      };
      backend_details?: {
        model?: {
          name?: string;
          version?: string;
        };
      };
    };
    scaling?: {
      backendDetails?: unknown;
      backend_details?: unknown;
    };
  };
}

export interface TeamDeployments {
  team: string;
  deployments: Deployment[];
}

export interface DeploymentList {
  count: number;
  deployments: TeamDeployments[];
}

export interface CreateDeploymentRequest {
  configurationRequest: {
    executableId: string;
    name: string;
    parameterBindings: Array<{
      key: string;
      value: string;
    }>;
    scenarioId: string;
  };
  team?: string; // Add team field to the request
}

export interface AuthCredentials {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  resourceGroup?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  early_access_token?: string;
}

export interface Configuration {
  id: string;
  name: string;
  createdAt: string;
  executableId: string;
  scenarioId: string;
  parameterBindings: Array<{
    key: string;
    value: string;
  }>;
  inputArtifactBindings: unknown[];
}

export interface ConfigurationsResponse {
  count: number;
  resources: Configuration[];
}

//TODO: Change to AIModel
export interface FoundationModel {
  id: string;
  model: string;
  displayName: string;
  provider: string;
  description: string;
  executableId: string;
  accessType: string;
  versions: ModelVersion[];
  latestVersion?: ModelVersion;
  capabilities: string[];
  contextLength?: number;
  tags: string[];
  scenarioId: string;
  allowedScenarios: Array<{
    executableId: string;
    scenarioId: string;
  }>;
}

export interface ModelVersion {
  name: string;
  isLatest?: boolean;
  capabilities?: string[];
  contextLength?: number;
  cost?: Array<{
    inputCost?: string;
    outputCost?: string;
    tier?: string;
    tierDescription?: string;
  }>;
  metadata?: Array<{
    meanWinRate?: string;
    chatBotArenaScore?: string;
    airBenchRefusalRate?: string;
    biasRefusalRate?: string;
    helmCapabilitiesAccuracyMeanScore?: string;
    mtebAverageScore?: string;
  }>;
  inputTypes?: string[];
  streamingSupported?: boolean;
  deprecated?: boolean;
  retirementDate?: string;
}

export interface ModelsResponse {
  count: number;
  totalCount: number;
  resources: FoundationModel[];
  providers: string[];
  capabilities: string[];
}

// Import the API client for making real backend calls
import { apiClient } from '@/services/ApiClient';


// Real API client that makes HTTP requests to backend endpoints
class AIApiClient {
  async getDeployments(params?: {
    status?: string;
    top?: number;
    skip?: number;
    resourceGroup?: string;
  }): Promise<DeploymentList> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    if (params?.status) queryParams.status = params.status;
    if (params?.top) queryParams.top = params.top;
    if (params?.skip) queryParams.skip = params.skip;
    if (params?.resourceGroup) queryParams.resourceGroup = params.resourceGroup;
    
    return apiClient.get<DeploymentList>('/ai-core/deployments', {
      params: queryParams
    });
  }

  async getDeployment(deploymentId: string): Promise<Deployment> {
    return apiClient.get<Deployment>(`/ai-core/deployments/${deploymentId}`);
  }

  async createDeployment(request: CreateDeploymentRequest): Promise<{ id: string }> {
    // Backend returns 202 status for scheduled deployment
    const response = await apiClient.post<{ id: string }>('/ai-core/deployments', request);
    return response;
  }

  async stopDeployment(deploymentId: string): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`/ai-core/deployments/${deploymentId}`, {
      targetStatus: 'STOPPED'
    });
  }

  async deleteDeployment(deploymentId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/ai-core/deployments/${deploymentId}`);
  }

  async getConfigurations(): Promise<ConfigurationsResponse> {
    // Note: GET configurations endpoint not available in backend swagger
    // Only POST (create) is available. This might need to be implemented or handled differently
    throw new Error('Get configurations operation not available in current backend API');
  }

  async createConfiguration(modelName: string, executableId: string, modelVersion: string = '1'): Promise<Configuration> {
    const configData = {
      name: `${modelName}_${Date.now()}`,
      executableId: executableId,
      scenarioId: 'foundation-models',
      parameterBindings: [
        { 
          key: 'modelName', 
          value: modelName 
        },
        { 
          key: 'modelVersion', 
          value: modelVersion 
        }
      ],
      inputArtifactBindings: []
    };
    
    // Backend returns 201 status for created configuration
    return apiClient.post<Configuration>('/ai-core/configurations', configData);
  }

  async getAllFoundationModels(params?: {
    search?: string;
    provider?: string;
  }): Promise<ModelsResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      scenarioId: 'foundation-models' // Required flag for models endpoint
    };
    
    if (params?.search) queryParams.search = params.search;
    if (params?.provider) queryParams.provider = params.provider;
    
    return apiClient.get<ModelsResponse>('/ai-core/models', {
      params: queryParams
    });
  }
}

export const aiApiClient = new AIApiClient();

// Auth manager - uses the same authentication as the rest of the app
export const aiAuthManager = {
  getStoredCredentials: () => {
    // AI Core credentials would be managed through the main auth system
    // For now, return null to indicate no specific AI Core credentials stored
    return null;
  },
  getToken: () => {
    // Use the same token management as the main API client
    // The apiClient will handle token refresh automatically
    return apiClient.hasToken() ? 'managed-by-api-client' : null;
  }
};

// React Query hooks - Now using real API endpoints
export const useAIAuth = () => {
  return useQuery({
    queryKey: ['ai-auth'],
    queryFn: async () => {
      if (!apiClient.hasToken()) {
        return {
          isAuthenticated: false,
          tenantId: 'unknown',
          credentials: null,
        };
      }
      
      try {
        // Fetch tenant info from deployments endpoint
        const deploymentsResponse = await apiClient.get<DeploymentList & { tenant?: string }>('/ai-core/deployments', {
          params: { top: 1 } // Just get one deployment to check tenant
        });
        
        // Extract tenant ID from response - check multiple possible locations
        const tenantId = deploymentsResponse.tenant || 
                        (deploymentsResponse as any).tenantId || 
                        (deploymentsResponse as any).tenant_id ||
                        'unknown';
        
        return {
          isAuthenticated: true,
          tenantId: tenantId,
          credentials: aiAuthManager.getStoredCredentials(),
        };
      } catch (error) {
        return {
          isAuthenticated: apiClient.hasToken(),
          tenantId: 'unknown',
          credentials: aiAuthManager.getStoredCredentials(),
        };
      }
    },
    enabled: apiClient.hasToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

export const useDeployments = (forceRefresh = false) => {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: () => aiApiClient.getDeployments({ top: 100 }),
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Disable automatic refresh - only refresh on demand
    retry: 3,
  });
};

export const useCreateDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: {
      configurationRequest: {
        executableId: string;
        name: string;
        parameterBindings: Array<{
          key: string;
          value: string;
        }>;
        scenarioId: string;
      };
      team?: string; // Add team parameter to the mutation function
    }) => aiApiClient.createDeployment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
  });
}

export const useCreateConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelName, executableId, modelVersion }: { 
      modelName: string; 
      executableId: string; 
      modelVersion?: string; 
    }) => aiApiClient.createConfiguration(modelName, executableId, modelVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
    },
  });
};

export const useFoundationModels = (params?: { search?: string; provider?: string }) => {
  return useQuery({
    queryKey: ['foundation-models', params],
    queryFn: () => aiApiClient.getAllFoundationModels(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useStopDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aiApiClient.stopDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
  });
};

export const useDeleteDeployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aiApiClient.deleteDeployment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
  });
};

// Chat inference types
export interface ChatMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatMessageContent[]; // Support both simple text and multimodal content
}

export interface ChatInferenceRequest {
  deploymentId: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  onChunk?: (content: string) => void; // Callback for streaming chunks
}

export interface ChatInferenceResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

// Add chat inference to API client
export const useChatInference = () => {
  return useMutation({
    mutationFn: async (request: ChatInferenceRequest): Promise<ChatInferenceResponse> => {
      // If streaming is requested, handle it differently
      if (request.stream) {
        return handleStreamingInference(request);
      }
      return apiClient.post<ChatInferenceResponse>('/ai-core/chat/inference', request);
    },
  });
};

// Handle streaming inference with SSE
async function handleStreamingInference(request: ChatInferenceRequest): Promise<ChatInferenceResponse> {
  // Get the access token from apiClient
  const token = await apiClient.getToken();

  // Get backend URL from runtime environment
  const backendUrl = getNewBackendUrl();

  // Now use fetch with proper authorization
  const response = await fetch(`${backendUrl}/api/v1/ai-core/chat/inference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
    credentials: 'include', // Include cookies for consistency with ApiClient
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start streaming inference');
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  // Read the SSE stream and accumulate the response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = '';
  let inferenceResponse: ChatInferenceResponse = {
    id: `stream-${Date.now()}`,
    object: 'chat.completion',
    created: Date.now(),
    model: 'unknown',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: ''
      },
      finish_reason: ''
    }],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6).trim();

          if (data === '[DONE]') {
            // Streaming complete
            inferenceResponse.choices[0].finish_reason = 'stop';
            return inferenceResponse;
          }

          try {
            const parsed = JSON.parse(data);

            // Handle OpenAI/GPT format
            if (parsed.choices && parsed.choices[0]) {
              const choice = parsed.choices[0];

              // Streaming chunk format
              if (choice.delta && choice.delta.content) {
                accumulatedContent += choice.delta.content;
                inferenceResponse.choices[0].message.content = accumulatedContent;

                // Call the onChunk callback if provided
                if (request.onChunk) {
                  request.onChunk(accumulatedContent);
                }
              }

              // Regular response format
              if (choice.message && choice.message.content) {
                inferenceResponse = parsed;
              }

              if (choice.finish_reason) {
                inferenceResponse.choices[0].finish_reason = choice.finish_reason;
              }
            }

            // Handle Anthropic format
            if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
              accumulatedContent += parsed.delta.text;
              inferenceResponse.choices[0].message.content = accumulatedContent;

              // Call the onChunk callback if provided
              if (request.onChunk) {
                request.onChunk(accumulatedContent);
              }
            }

            // Update metadata
            if (parsed.id) inferenceResponse.id = parsed.id;
            if (parsed.model) inferenceResponse.model = parsed.model;
            if (parsed.usage) inferenceResponse.usage = parsed.usage;

          } catch (e) {
            console.warn('Failed to parse SSE data:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return inferenceResponse;
}

// File upload types
export interface UploadedFile {
  url: string; // Base64 data URL
  mimeType: string;
  filename: string;
  size: number;
}

export interface UploadFilesResponse {
  files: UploadedFile[];
  count: number;
  totalSize: number;
}

// Add file upload hook
export const useUploadFiles = () => {
  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadFilesResponse> => {
      const formData = new FormData();

      // Add all files to the form data
      files.forEach(file => {
        formData.append('files', file);
      });

      // Use fetch directly for file upload with proper headers
      // Get token from apiClient
      const token = await apiClient.getToken();

      // Get backend URL from runtime environment
      const backendUrl = getNewBackendUrl();

      // Build headers with Authorization
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${backendUrl}/api/v1/ai-core/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload files');
      }

      return response.json();
    },
  });
};
