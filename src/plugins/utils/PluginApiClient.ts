/**
 * Plugin API Client
 * 
 * Provides a scoped API client for plugins that automatically
 * prefixes all requests with /api/plugins/:pluginId/
 * 
 * This ensures plugins can only access their designated endpoints
 * and inherits authentication from the main portal API client.
 */

import { apiClient } from '@/services/ApiClient';
import type { PluginApiClient as IPluginApiClient, RequestOptions } from '../types/plugin.types';

/**
 * Implementation of the PluginApiClient interface
 * 
 * All API calls are automatically scoped to /api/plugins/:pluginId/*
 * and inherit authentication from the portal's main API client.
 */
export class PluginApiClient implements IPluginApiClient {
  private readonly pluginId: string;
  private readonly basePath: string;

  constructor(pluginId: string) {
    if (!pluginId || pluginId.trim() === '') {
      throw new Error('Plugin ID is required for PluginApiClient');
    }
    
    this.pluginId = pluginId;
    this.basePath = `/plugins/${pluginId}`;
  }

  private buildScopedPath(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.basePath}${normalizedPath}`;
  }

  async get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    const scopedPath = this.buildScopedPath(path);
    return apiClient.get<T>(scopedPath, {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const scopedPath = this.buildScopedPath(path);
    return apiClient.post<T>(scopedPath, body, {
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const scopedPath = this.buildScopedPath(path);
    return apiClient.put<T>(scopedPath, body, {
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  async delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    const scopedPath = this.buildScopedPath(path);
    return apiClient.delete<T>(scopedPath, {
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  async patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    const scopedPath = this.buildScopedPath(path);
    return apiClient.patch<T>(scopedPath, body, {
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getBasePath(): string {
    return this.basePath;
  }
}