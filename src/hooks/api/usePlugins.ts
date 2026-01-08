import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Plugin data from API
 */
export interface PluginApiData {
  id: string;
  name: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
  version?: string;
  react_component_path?: string;
  backend_server_url?: string;
  owner: string;
   metadata?: {                        
    author_name?: string;        
    [key: string]: any;                
  };
  subscribed?: boolean; // Whether the current user is subscribed to this plugin
}

/**
 * Paginated plugins response from API
 */
export interface PluginsListResponse {
  plugins: PluginApiData[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Query parameters for fetching plugins
 */
export interface PluginsQueryParams {
  limit?: number;
  offset?: number;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch plugins with pagination
 */
async function fetchPlugins(params: PluginsQueryParams = {}): Promise<PluginsListResponse> {
  const defaultParams = {
    limit: 20,
    offset: 0,
    ...params,
  };

  return apiClient.get<PluginsListResponse>('/plugins', {
    params: defaultParams as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * Response from plugin UI endpoint
 */
export interface PluginUIResponse {
  content: string;
  content_type: string;
}

/**
 * Fetch plugin UI bundle content from API
 */
export async function fetchPluginUI(pluginId: string): Promise<PluginUIResponse> {
  return apiClient.get<PluginUIResponse>(`/plugins/${pluginId}/ui`);
}

/**
 * Check if a URL is a GitHub link
 */
export function isGitHubUrl(url?: string): boolean {
  if (!url) return false;
  return url.toLowerCase().includes('github');
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to fetch all plugins with pagination support
 */
export function usePlugins(
  params: PluginsQueryParams = {},
  options?: Omit<
    UseQueryOptions<PluginsListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<PluginsListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.plugins.list(params),
    queryFn: () => fetchPlugins(params),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single plugin by ID
 */
export function usePlugin(
  pluginId: string,
  options?: Omit<
    UseQueryOptions<PluginApiData, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<PluginApiData, Error> {
  return useQuery({
    queryKey: queryKeys.plugins.detail(pluginId),
    queryFn: () => apiClient.get<PluginApiData>(`/plugins/${pluginId}`),
    enabled: !!pluginId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch plugin UI content
 */
export function usePluginUI(
  pluginId: string,
  enabled: boolean = true,
  options?: Omit<
    UseQueryOptions<PluginUIResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<PluginUIResponse, Error> {
  return useQuery({
    queryKey: [...queryKeys.plugins.detail(pluginId), 'ui'],
    queryFn: () => fetchPluginUI(pluginId),
    enabled: !!pluginId && enabled,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Helper to create a blob URL from JavaScript content
 */
export function createBlobUrlFromContent(content: string): string {
  const blob = new Blob([content], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}