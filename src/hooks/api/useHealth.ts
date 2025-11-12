/**
 * Custom hook for fetching component health statuses
 * NO CACHING - fresh data on every call
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Component, ComponentHealthCheck, HealthDashboardState, HealthSummary, LandscapeConfig } from '@/types/health';
import { fetchAllHealthStatuses } from '@/services/healthApi';

interface UseHealthOptions {
  components: Component[];
  landscape: LandscapeConfig;
  enabled: boolean;
}

interface UseHealthReturn extends HealthDashboardState {
  progress: { completed: number; total: number };
  refetch: () => void;
}

export function useHealth({ components, landscape, enabled }: UseHealthOptions): UseHealthReturn {
  const [state, setState] = useState<HealthDashboardState>({
    landscape: landscape.name,
    components: [],
    isLoading: false,
    summary: { total: 0, up: 0, down: 0, unknown: 0, error: 0 },
  });

  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateSummary = useCallback((healthChecks: ComponentHealthCheck[]): HealthSummary => {
    const responseTimes = healthChecks
      .filter(h => h.responseTime !== undefined)
      .map(h => h.responseTime!);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const summary = {
      total: healthChecks.length,
      up: healthChecks.filter(h => h.status === 'UP').length,
      down: healthChecks.filter(h => h.status === 'DOWN').length,
      unknown: healthChecks.filter(h => h.status === 'UNKNOWN' || h.status === 'OUT_OF_SERVICE').length,
      error: healthChecks.filter(h => h.status === 'ERROR').length,
      avgResponseTime: Math.round(avgResponseTime),
    };
    return summary;
  }, []);

  const fetchHealth = useCallback(async () => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, components: [] }));
    setProgress({ completed: 0, total: components.length });

    try {
      const healthChecks = await fetchAllHealthStatuses(
        components,
        landscape,
        abortControllerRef.current.signal,
        (completed, total) => {
          setProgress({ completed, total });
        }
      );

      const summary = calculateSummary(healthChecks);

      setState({
        landscape: landscape.name,
        components: healthChecks,
        isLoading: false,
        summary,
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [components, landscape, calculateSummary]);

  // Fetch health when landscape or components change
  useEffect(() => {
    if (enabled && components.length > 0) {
      fetchHealth();
    }

    return () => {
      // Cleanup: abort ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchHealth, components.length, landscape.name]);

  return {
    ...state,
    progress,
    refetch: fetchHealth,
  };
}
