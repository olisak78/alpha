/**
 * Plugin System Types
 * 
 * Core type definitions for the plugin architecture.
 * These types define the contract between plugin developers and the portal.
 */

import { ReactNode } from 'react';

/**
 * Theme interface matching the portal's ThemeContext
 */
export interface PluginTheme {
  theme: 'light' | 'dark' | 'system';
  actualTheme: 'light' | 'dark';
}

/**
 * Plugin metadata stored in the database
 */
export interface PluginMetadata {
  /** Unique plugin identifier (used in API routes) */
  id: string;
  
  /** Display name shown in the portal */
  name: string;
  
  /** Brief description of the plugin's purpose */
  description?: string;
  
  /** Version of the plugin (semver format) */
  version: string;
  
  /** Author/team name */
  author: string;
  
  /** URL to the plugin's JavaScript bundle (GitHub raw URL or CDN) */
  bundleUrl: string;
  
  /** Icon name from Lucide React (optional) */
  icon?: string;
  
  /** Tags for categorization/filtering */
  tags?: string[];
  
  /** Whether the plugin is enabled */
  enabled: boolean;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
  
  /** Plugin configuration options (JSON) */
  config?: Record<string, any>;
}

/**
 * API client interface provided to plugins for backend communication
 */
export interface PluginApiClient {
  /**
   * GET request to /api/plugins/:pluginId/*
   * @param path - Path segment after /api/plugins/:pluginId/
   * @param options - Fetch options
   */
  get<T = any>(path: string, options?: RequestInit): Promise<T>;
  
  /**
   * POST request to /api/plugins/:pluginId/*
   * @param path - Path segment after /api/plugins/:pluginId/
   * @param body - Request body
   * @param options - Additional fetch options
   */
  post<T = any>(path: string, body?: any, options?: RequestInit): Promise<T>;
  
  /**
   * PUT request to /api/plugins/:pluginId/*
   * @param path - Path segment after /api/plugins/:pluginId/
   * @param body - Request body
   * @param options - Additional fetch options
   */
  put<T = any>(path: string, body?: any, options?: RequestInit): Promise<T>;
  
  /**
   * DELETE request to /api/plugins/:pluginId/*
   * @param path - Path segment after /api/plugins/:pluginId/
   * @param options - Fetch options
   */
  delete<T = any>(path: string, options?: RequestInit): Promise<T>;
}

/**
 * Context provided to plugin components
 */
export interface PluginContext {
  /** Plugin metadata from database */
  metadata: PluginMetadata;
  
  /** API client configured for this plugin */
  apiClient: PluginApiClient;
  
  /** Current theme */
  theme: PluginTheme;
  
  /** Plugin-specific configuration */
  config?: Record<string, any>;
}

/**
 * Props passed to plugin components
 */
export interface PluginComponentProps {
  /** Plugin context with utilities and metadata */
  context: PluginContext;
}

/**
 * Plugin component type
 * This is what plugin developers export from their bundles
 */
export type PluginComponent = React.ComponentType<PluginComponentProps>;

/**
 * Plugin module structure
 * This is what the bundle should export
 */
export interface PluginModule {
  /** The main plugin component */
  default: PluginComponent;
  
  /** Optional plugin-specific configuration schema */
  configSchema?: Record<string, any>;
  
  /** Optional initialization function */
  initialize?: (context: PluginContext) => void | Promise<void>;
  
  /** Optional cleanup function */
  cleanup?: () => void | Promise<void>;
}

/**
 * Plugin loading states
 */
export type PluginLoadingState = 
  | 'idle'
  | 'loading-metadata'
  | 'loading-bundle'
  | 'initializing'
  | 'ready'
  | 'error';

/**
 * Plugin error types
 */
export interface PluginError {
  type: 'metadata' | 'bundle' | 'initialization' | 'runtime';
  message: string;
  details?: any;
}

/**
 * Plugin container props
 */
export interface BasePluginProps {
  /** Plugin ID to load */
  pluginId: string;
  
  /** Optional initial configuration override */
  initialConfig?: Record<string, any>;
  
  /** Optional error handler */
  onError?: (error: PluginError) => void;
  
  /** Optional loading state change handler */
  onStateChange?: (state: PluginLoadingState) => void;
}