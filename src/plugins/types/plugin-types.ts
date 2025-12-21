/**
 * Plugin metadata stored in the database
 * This is what gets saved when a developer registers their plugin
 */
export interface PluginMetadata {
  id: string;
  name: string;
  title: string;
  description: string;
  createdBy: string;
  version?: string;
  author?: string;
  bundleUrl?: string;
  jsPath?: string;
  componentPath?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Theme information from the portal
 */
export interface PluginTheme {
  mode: 'light' | 'dark';

  primaryColor: string;
  
  /** Common color palette */
  colors: {
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    destructive: string;
    border: string;
  };
}

/**
 * Context provided to the plugin by the portal
 * This is what plugins receive as props
 */
export interface PluginContext {
  theme: PluginTheme;
  apiClient: PluginApiClient;
  metadata: PluginMetadata;
  config?: Record<string, any>;
  utils: {
    toast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    navigate: (path: string) => void;
  };
}

/**
 * API client provided to plugins for backend communication
 * All calls are automatically scoped to /api/plugins/:pluginId/*
 */
export interface PluginApiClient {

  get<T = any>(path: string, options?: RequestOptions): Promise<T>;
  post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T>;
  put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T>;
  delete<T = any>(path: string, options?: RequestOptions): Promise<T>;
  patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T>;
}

/**
 * Options for API requests
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Props that every plugin component will receive
 */
export interface PluginProps {
  /** Context with theme, API client, and utilities */
  context: PluginContext;
}

/**
 * The plugin component type
 * Plugin developers must export a component matching this signature
 */
export type PluginComponent = React.ComponentType<PluginProps>;

/**
 * Plugin manifest that must be exported from the bundle
 * This is the default export from the plugin bundle
 */
export interface PluginManifest {
  /** The plugin's React component */
  component: PluginComponent;
  
  /** Plugin metadata (must match what's in the DB) */
  metadata: {
    name: string;
    version: string;
    author: string;
  };
  
  /** Optional lifecycle hooks */
  hooks?: {
    /** Called when plugin is mounted */
    onMount?: () => void | Promise<void>;
    
    /** Called when plugin is unmounted */
    onUnmount?: () => void | Promise<void>;
    
    /** Called when plugin config changes */
    onConfigChange?: (newConfig: Record<string, any>) => void | Promise<void>;
  };
}

/**
 * Plugin loading states
 */
export type PluginLoadState = 
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

/**
 * Plugin error types
 */
export interface PluginError {
  /** Error type */
  type: 'network' | 'parse' | 'runtime' | 'compatibility' | 'security';
  
  /** Human-readable error message */
  message: string;
  
  /** Original error object if available */
  originalError?: Error;
  
  /** Additional context */
  details?: Record<string, any>;
}

/**
 * Plugin state tracked by the portal
 */
export interface PluginState {
  /** Current loading state */
  loadState: PluginLoadState;
  
  /** Error information if loadState is 'error' */
  error?: PluginError;
  
  /** Loaded manifest if loadState is 'ready' */
  manifest?: PluginManifest;
  
  /** Timestamp when plugin was loaded */
  loadedAt?: string;
}

/**
 * Response when fetching all plugins
 */
export interface PluginsListResponse {
  plugins: PluginMetadata[];
  total: number;
}

/**
 * Response when fetching a single plugin
 */
export interface PluginResponse {
  plugin: PluginMetadata;
}

/**
 * Response when creating or updating a plugin
 */
export interface PluginMutationResponse {
  plugin: PluginMetadata;
  message: string;
}

/**
 * Plugin query parameters for filtering
 */
export interface PluginQueryParams {
  /** Filter by category */
  category?: string;
  
  /** Filter by enabled status */
  enabled?: boolean;
  
  /** Search by name or description */
  search?: string;
  
  /** Pagination */
  page?: number;
  pageSize?: number;
}

/**
 * Payload for registering a new plugin
 */
export interface RegisterPluginRequest {
  name: string;
  title: string;
  description: string;
  version: string;
  author: string;
  createdBy?: string;
  bundleUrl: string;
  jsPath?: string;
  componentPath?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  configSchema?: Record<string, any>;
  minPortalVersion?: string;
}

/**
 * Payload for updating an existing plugin
 */
export interface UpdatePluginRequest {
  name?: string;
  title?: string;
  description?: string;
  version?: string;
  bundleUrl?: string;
  jsPath?: string;
  componentPath?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  enabled?: boolean;
  configSchema?: Record<string, any>;
}