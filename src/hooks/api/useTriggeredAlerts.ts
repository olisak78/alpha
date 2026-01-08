import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getTriggeredAlerts,
  getTriggeredAlert,
  getAlertProjects,
  getTriggeredAlertsFilters,
  TriggeredAlertsQueryParams,
} from '@/services/triggeredAlertsApi';
import type { TriggeredAlert, TriggeredAlertsResponse, TriggeredAlertsFiltersResponse } from '@/types/api';

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to fetch triggered alerts for a specific project
 * @param projectname - The name of the project
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Additional query options
 */
export function useTriggeredAlerts(
  projectname: string,
  params?: TriggeredAlertsQueryParams,
  options?: Omit<
    UseQueryOptions<TriggeredAlertsResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TriggeredAlertsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.triggeredAlerts.byProject(projectname, params),
    queryFn: () => getTriggeredAlerts(projectname, params),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (alerts change frequently)
    enabled: !!projectname,
    ...options,
  });
}

/**
 * Hook to fetch a specific triggered alert by project name and fingerprint
 * @param projectname - The name of the project
 * @param fingerprint - The unique fingerprint of the alert
 * @param options - Additional query options
 */
export function useTriggeredAlert(
  projectname: string,
  fingerprint: string,
  options?: Omit<
    UseQueryOptions<TriggeredAlert, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TriggeredAlert, Error> {
  return useQuery({
    queryKey: queryKeys.triggeredAlerts.detail(projectname, fingerprint),
    queryFn: () => getTriggeredAlert(projectname, fingerprint),
    staleTime: 1 * 60 * 1000, // Cache for 1 minute (individual alerts change frequently)
    enabled: !!projectname && !!fingerprint,
    ...options,
  });
}

/**
 * Hook to fetch list of all project names that have alerts
 * @param options - Additional query options
 */
export function useAlertProjects(
  options?: Omit<
    UseQueryOptions<string[], Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: queryKeys.triggeredAlerts.projects(),
    queryFn: getAlertProjects,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (project list changes less frequently)
    ...options,
  });
}

/**
 * Hook to fetch filters for triggered alerts of a specific project
 * @param projectname - The name of the project
 * @param options - Additional query options
 */
export function useTriggeredAlertsFilters(
  projectname: string,
  options?: Omit<
    UseQueryOptions<TriggeredAlertsFiltersResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TriggeredAlertsFiltersResponse, Error> {
  return useQuery({
    queryKey: queryKeys.triggeredAlerts.filters(projectname),
    queryFn: () => getTriggeredAlertsFilters(projectname),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (filters change less frequently)
    enabled: !!projectname,
    ...options,
  });
}
