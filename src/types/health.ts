/**
 * Health status types for component health monitoring
 */

import type { Component } from './api';

export type { Component };

export type HealthStatus = 'UP' | 'DOWN' | 'UNKNOWN' | 'OUT_OF_SERVICE' | 'ERROR';

/**
 * Response from a component's /health endpoint
 */
export interface HealthResponse {
  status: HealthStatus;
  details?: Record<string, any>;
  description?: string;
  healthy?: boolean;
  healthURL?: string;
}

/**
 * Individual component health within a health response
 */
export interface ComponentHealth {
  status: HealthStatus;
  description?: string;
  details?: Record<string, any>;
  components?: Record<string, ComponentHealth>; // Nested components
}

/**
 * Health check result for a single component
 */
export interface ComponentHealthCheck {
  componentId: string;
  componentName: string;
  landscape: string;
  healthUrl: string;
  status: HealthStatus | 'LOADING' | 'ERROR';
  response?: HealthResponse;
  error?: string;
  lastChecked?: Date;
  responseTime?: number; // in milliseconds
}

/**
 * Dashboard state containing all health checks and summary
 */
export interface HealthDashboardState {
  landscape: string;
  components: ComponentHealthCheck[];
  isLoading: boolean;
  summary: HealthSummary;
}

/**
 * Summary statistics for health dashboard
 */
export interface HealthSummary {
  total: number;
  up: number;
  down: number;
  unknown: number;
  error: number;
  avgResponseTime: number; // in milliseconds
}

/**
 * Landscape configuration for health checks
 */
export interface LandscapeConfig {
  id: string;
  name: string;
  route: string;
}
