/**
 * Plugin System Type Definitions
 * 
 * This file defines the core interfaces and types for the plugin system.
 * Plugin developers will implement these interfaces to create compatible plugins.
 */

import { ReactNode } from 'react';

// ============================================================================
// PLUGIN METADATA - Information about the plugin stored in DB
// ============================================================================

/**
 * Plugin metadata stored in the database
 * This is what gets saved when a developer registers their plugin
 */
export interface PluginMetadata {
  /** Unique identifier for the plugin */
  id: string;

  /** Machine-friendly plugin name */
  name: string;

  /** Human-readable title displayed in the portal */
  title: string;

  /** Short description of what the plugin does */
  description: string;

  /** Who created the plugin */
  createdBy: string;

  /** Version following semver (e.g., "1.0.0") */
  version?: string;

  /** Author/developer name or team */
  author?: string;

  /** URL to the compiled JS bundle (e.g., GitHub raw URL or CDN) */
  bundleUrl?: string;

  /** Path to the compiled JS bundle as provided by the registry */
  jsPath?: string;

  /** Path to the plugin component inside the bundle (if applicable) */
  componentPath?: string;

  /** Optional icon URL or emoji */
  icon?: string;

  /** Category for organizing plugins (e.g., "Data", "Monitoring", "Tools") */
  category?: string;

  /** Tags for searchability */
  tags?: string[];

  /** Whether the plugin is currently active/enabled */
  enabled?: boolean;

  /** Timestamp when the plugin was registered */
  createdAt?: string;

  /** Timestamp of last update */
  updatedAt?: string;

  /** Optional configuration schema for plugin settings */
  configSchema?: Record<string, any>;

  /** Minimum portal version required (semver) */
  minPortalVersion?: string;
}

// ============================================================================
// PLUGIN CONTEXT - Portal resources available to plugins
// ============================================================================

/**
 * Theme information from the portal
 */
export interface PluginTheme {
  /** Current theme mode */
  mode: 'light' | 'dark';
  
  /** Primary color used in the portal */
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
  /** Theme information for consistent styling */
  theme: PluginTheme;
  
  /** API client for making plugin-specific backend calls */
  apiClient: PluginApiClient;
  
  /** Plugin's own metadata */
  metadata: PluginMetadata;
  
  /** Optional configuration values set by admin/user */
  config?: Record<string, any>;
  
  /** Portal utilities */
  utils: {
    /** Show toast notification */
    toast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    
    /** Navigate to another page in the portal */
    navigate: (path: string) => void;
  };
}

// ============================================================================
// PLUGIN API CLIENT - Helper for backend communication
// ============================================================================

/**
 * API client provided to plugins for backend communication
 * All calls are automatically scoped to /api/plugins/:pluginId/*
 */
export interface PluginApiClient {
  /**
   * Make a GET request to the plugin's backend endpoint
   * @param path - Path relative to /api/plugins/:pluginId/
   * @returns Promise with typed response data
   */
  get<T = any>(path: string, options?: RequestOptions): Promise<T>;
  
  /**
   * Make a POST request to the plugin's backend endpoint
   * @param path - Path relative to /api/plugins/:pluginId/
   * @param body - Request body (will be JSON stringified)
   * @returns Promise with typed response data
   */
  post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T>;
  
  /**
   * Make a PUT request to the plugin's backend endpoint
   */
  put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T>;
  
  /**
   * Make a DELETE request to the plugin's backend endpoint
   */
  delete<T = any>(path: string, options?: RequestOptions): Promise<T>;
  
  /**
   * Make a PATCH request to the plugin's backend endpoint
   */
  patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T>;
}

/**
 * Options for API requests
 */
export interface RequestOptions {
  /** Additional headers to include */
  headers?: Record<string, string>;
  
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

// ============================================================================
// PLUGIN COMPONENT INTERFACE - What plugins must export
// ============================================================================

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

// ============================================================================
// PLUGIN STATE - For managing plugin loading and errors
// ============================================================================

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

// ============================================================================
// API RESPONSE TYPES - Backend responses
// ============================================================================

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

// ============================================================================
// PLUGIN REGISTRATION - For developers registering plugins
// ============================================================================

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