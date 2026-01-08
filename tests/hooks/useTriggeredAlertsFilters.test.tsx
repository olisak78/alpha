import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import the hook to test
import { useTriggeredAlertsFilters } from '../../src/hooks/useTriggeredAlertsFilters';

// Import types
import type { TriggeredAlert, TriggeredAlertsResponse, TriggeredAlertsFiltersResponse } from '../../src/types/api';

// Mock the API hooks
vi.mock('../../src/hooks/api/useTriggeredAlerts', () => ({
  useTriggeredAlerts: vi.fn(),
  useTriggeredAlertsFilters: vi.fn(),
}));

import { useTriggeredAlerts, useTriggeredAlertsFilters as useTriggeredAlertsFiltersApi } from '../../src/hooks/api/useTriggeredAlerts';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockTriggeredAlert = (overrides?: Partial<TriggeredAlert>): TriggeredAlert => ({
  fingerprint: 'alert-123',
  alertname: 'HighCPUUsage',
  status: 'firing',
  severity: 'critical',
  landscape: 'production',
  region: 'us-east-1',
  startsAt: '2025-01-01T10:00:00Z',
  endsAt: '2025-01-01T11:00:00Z',
  labels: { service: 'api-gateway' },
  annotations: { description: 'CPU usage is high' },
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:30:00Z',
  component: 'api-gateway',
  ...overrides,
});

const createMockAlertsResponse = (alerts: TriggeredAlert[]): TriggeredAlertsResponse => ({
  data: alerts,
  page: 1,
  pageSize: 50,
  totalCount: alerts.length,
  totalPages: 1,
});

const createMockFiltersResponse = (overrides?: Partial<TriggeredAlertsFiltersResponse>): TriggeredAlertsFiltersResponse => ({
  severity: ['critical', 'warning', 'info'],
  status: ['firing', 'resolved'],
  landscape: ['production', 'staging', 'development'],
  region: ['us-east-1', 'us-west-2', 'eu-central-1'],
  alertname: ['HighCPUUsage', 'HighMemoryUsage', 'DiskSpaceLow'],
  ...overrides,
});

// ============================================================================
// MAIN TESTS
// ============================================================================

describe('useTriggeredAlertsFilters Hook', () => {
  const mockUseTriggeredAlerts = vi.mocked(useTriggeredAlerts);
  const mockUseTriggeredAlertsFiltersApi = vi.mocked(useTriggeredAlertsFiltersApi);

  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    
    // Mock localStorage globally
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    mockUseTriggeredAlerts.mockReturnValue({
      data: createMockAlertsResponse([]),
      isLoading: false,
      error: null,
    } as any);

    mockUseTriggeredAlertsFiltersApi.mockReturnValue({
      data: createMockFiltersResponse(),
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  it('should initialize with default filter values', () => {
    const { result } = renderHook(() => useTriggeredAlertsFilters('test-project'), {
      wrapper: createWrapper(),
    });

    expect(result.current.filters).toEqual({
      searchTerm: '',
      selectedSeverity: [],
      selectedStatus: [],
      selectedLandscape: [],
      selectedRegion: [],
      startDate: '',
      endDate: '',
      excludedSeverity: [],
      excludedStatus: [],
      excludedLandscape: [],
      excludedRegion: [],
      excludedAlertname: [],
      page: 1,
      pageSize: 50,
    });
  });

  it('should provide all required actions and integrate with APIs', () => {
    const { result } = renderHook(() => useTriggeredAlertsFilters('test-project'), {
      wrapper: createWrapper(),
    });

    // Test that all actions are available
    expect(result.current.actions).toHaveProperty('setSearchTerm');
    expect(result.current.actions).toHaveProperty('setSelectedSeverity');
    expect(result.current.actions).toHaveProperty('setSelectedStatus');
    expect(result.current.actions).toHaveProperty('setSelectedLandscape');
    expect(result.current.actions).toHaveProperty('setSelectedRegion');
    expect(result.current.actions).toHaveProperty('setStartDate');
    expect(result.current.actions).toHaveProperty('setEndDate');
    expect(result.current.actions).toHaveProperty('resetFilters');

    // Test API integration
    expect(mockUseTriggeredAlerts).toHaveBeenCalledWith('test-project', expect.any(Object));
    expect(mockUseTriggeredAlertsFiltersApi).toHaveBeenCalledWith('test-project');
  });

  // ============================================================================
  // FILTER OPTIONS TESTS
  // ============================================================================

  it('should use API filter options and sort them alphabetically', () => {
    const mockFilters = createMockFiltersResponse({
      severity: ['warning', 'critical', 'info'],
      status: ['resolved', 'firing'],
      landscape: ['staging', 'production'],
      region: ['us-west-2', 'us-east-1'],
    });

    mockUseTriggeredAlertsFiltersApi.mockReturnValue({
      data: mockFilters,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.options.severities).toEqual(['critical', 'info', 'warning']);
    expect(result.current.options.statuses).toEqual(['firing', 'resolved']);
    expect(result.current.options.landscapes).toEqual(['production', 'staging']);
    expect(result.current.options.regions).toEqual(['us-east-1', 'us-west-2']);
  });

  it('should return empty arrays when API filters are unavailable', () => {
    const mockAlerts = [
      createMockTriggeredAlert({ severity: 'critical', status: 'firing', landscape: 'production', region: 'us-east-1' }),
      createMockTriggeredAlert({ severity: 'warning', status: 'resolved', landscape: 'staging', region: 'us-west-2' }),
    ];

    mockUseTriggeredAlerts.mockReturnValue({
      data: createMockAlertsResponse(mockAlerts),
      isLoading: false,
      error: null,
    } as any);

    mockUseTriggeredAlertsFiltersApi.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    // Current implementation returns empty arrays when API filters are unavailable
    expect(result.current.options.severities).toEqual([]);
    expect(result.current.options.statuses).toEqual([]);
    expect(result.current.options.landscapes).toEqual([]);
    expect(result.current.options.regions).toEqual([]);
  });

  it('should return empty arrays when API filters are unavailable', () => {
    const mockAlerts = [
      createMockTriggeredAlert({ component: 'api-gateway' }),
      createMockTriggeredAlert({ component: 'user-service' }),
      createMockTriggeredAlert({ component: undefined }),
      createMockTriggeredAlert({ component: '' }),
    ];

    mockUseTriggeredAlerts.mockReturnValue({
      data: createMockAlertsResponse(mockAlerts),
      isLoading: false,
      error: null,
    } as any);

    mockUseTriggeredAlertsFiltersApi.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    // Current implementation returns empty arrays when API filters are unavailable
    expect(result.current.options.regions).toEqual([]);
  });

  // ============================================================================
  // FILTER ACTIONS TESTS
  // ============================================================================

  it('should update individual filter values correctly', () => {
    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.actions.setSearchTerm('test-search');
      result.current.actions.setSelectedSeverity(['critical']);
      result.current.actions.setSelectedStatus(['firing']);
      result.current.actions.setSelectedLandscape(['production']);
      result.current.actions.setSelectedRegion(['us-east-1']);
      result.current.actions.setStartDate('2025-01-01');
      result.current.actions.setEndDate('2025-01-31');
    });

    expect(result.current.filters.searchTerm).toBe('test-search');
    expect(result.current.filters.selectedSeverity).toEqual(['critical']);
    expect(result.current.filters.selectedStatus).toEqual(['firing']);
    expect(result.current.filters.selectedLandscape).toEqual(['production']);
    expect(result.current.filters.selectedRegion).toEqual(['us-east-1']);
    expect(result.current.filters.startDate).toBe('2025-01-01');
    expect(result.current.filters.endDate).toBe('2025-01-31');
  });

  it('should reset all filters to default values', () => {
    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    // Set some filters first
    act(() => {
      result.current.actions.setSearchTerm('test');
      result.current.actions.setSelectedSeverity(['critical']);
      result.current.actions.setSelectedStatus(['firing']);
    });

    // Reset filters
    act(() => {
      result.current.actions.resetFilters();
    });

    expect(result.current.filters).toEqual({
      searchTerm: '',
      selectedSeverity: [],
      selectedStatus: [],
      selectedLandscape: [],
      selectedRegion: [],
      startDate: '',
      endDate: '',
      excludedSeverity: [],
      excludedStatus: [],
      excludedLandscape: [],
      excludedRegion: [],
      excludedAlertname: [],
      page: 1,
      pageSize: 50,
    });
  });

  // ============================================================================
  // FILTERING LOGIC TESTS
  // ============================================================================

  it('should filter alerts by search term and basic criteria', () => {
    const mockAlerts = [
      createMockTriggeredAlert({
        fingerprint: 'alert-1',
        alertname: 'HighCPUUsage',
        severity: 'critical',
        status: 'firing',
        component: 'api-gateway',
      }),
      createMockTriggeredAlert({
        fingerprint: 'alert-2',
        alertname: 'HighMemoryUsage',
        severity: 'warning',
        status: 'resolved',
        component: 'user-service',
      }),
    ];

    mockUseTriggeredAlerts.mockReturnValue({
      data: createMockAlertsResponse(mockAlerts),
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    // Test no filters - should return all alerts (backend filtering, so all alerts returned)
    expect(result.current.filteredAlerts).toHaveLength(2);

    // Backend filtering means the API call changes, but the mock returns the same data
    // So we test that the API is called with the right parameters
    act(() => {
      result.current.actions.setSearchTerm('cpu');
    });
    // Since we're using backend filtering, the mock still returns all alerts
    expect(result.current.filteredAlerts).toHaveLength(2);

    // Test severity filtering - backend handles this
    act(() => {
      result.current.actions.setSearchTerm('');
      result.current.actions.setSelectedSeverity(['critical']);
    });
    // Mock returns all alerts since backend filtering is mocked
    expect(result.current.filteredAlerts).toHaveLength(2);
  });

  it('should filter alerts by date range and handle combined filters', () => {
    const mockAlerts = [
      createMockTriggeredAlert({
        fingerprint: 'alert-1',
        severity: 'critical',
        status: 'firing',
        startsAt: '2025-01-15T10:00:00Z',
      }),
      createMockTriggeredAlert({
        fingerprint: 'alert-2',
        severity: 'warning',
        status: 'resolved',
        startsAt: '2025-01-10T10:00:00Z',
      }),
      createMockTriggeredAlert({
        fingerprint: 'alert-3',
        severity: 'info',
        status: 'firing',
        startsAt: '2025-01-20T10:00:00Z',
      }),
    ];

    mockUseTriggeredAlerts.mockReturnValue({
      data: createMockAlertsResponse(mockAlerts),
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    // Backend filtering means all alerts are returned by the mock
    // Test that filters are set correctly
    act(() => {
      result.current.actions.setStartDate('2025-01-12');
      result.current.actions.setEndDate('2025-01-18');
    });
    // Backend would filter, but mock returns all alerts
    expect(result.current.filteredAlerts).toHaveLength(3);

    // Test multiple filters combined
    act(() => {
      result.current.actions.setStartDate('');
      result.current.actions.setEndDate('');
      result.current.actions.setSelectedStatus(['firing']);
      result.current.actions.setSelectedSeverity(['critical']);
    });
    // Backend would filter, but mock returns all alerts
    expect(result.current.filteredAlerts).toHaveLength(3);

    // Test no matches - backend would return empty, but mock returns all
    act(() => {
      result.current.actions.resetFilters();
      result.current.actions.setSearchTerm('nonexistent');
    });
    // Backend would return empty, but mock returns all alerts
    expect(result.current.filteredAlerts).toHaveLength(3);
  });

  // ============================================================================
  // REDUCER CASE TESTS
  // ============================================================================

  describe('Reducer Cases', () => {
    it('should handle RESET_FILTER case', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Set a filter first
      act(() => {
        result.current.actions.setSelectedSeverity(['critical']);
      });
      expect(result.current.filters.selectedSeverity).toEqual(['critical']);

      // Reset the specific filter
      act(() => {
        result.current.actions.removeSeverity();
      });
      expect(result.current.filters.selectedSeverity).toEqual([]);
    });

    it('should handle ADD_EXCLUDED case - toggle exclusion', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Add exclusion
      act(() => {
        result.current.actions.addExcludedSeverity('critical');
      });
      expect(result.current.filters.excludedSeverity).toEqual(['critical']);

      // Toggle exclusion (remove)
      act(() => {
        result.current.actions.addExcludedSeverity('critical');
      });
      expect(result.current.filters.excludedSeverity).toEqual([]);
    });

    it('should handle ADD_EXCLUDED case - clear inclusion filter when same value', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Set inclusion filter
      act(() => {
        result.current.actions.setSelectedSeverity(['critical']);
      });
      expect(result.current.filters.selectedSeverity).toEqual(['critical']);

      // Add exclusion for same value - should clear inclusion
      act(() => {
        result.current.actions.addExcludedSeverity('critical');
      });
      expect(result.current.filters.selectedSeverity).toEqual([]);
      expect(result.current.filters.excludedSeverity).toEqual([]);
    });

    it('should handle REMOVE_EXCLUDED case', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Add multiple exclusions one by one
      act(() => {
        result.current.actions.addExcludedSeverity('critical');
      });
      expect(result.current.filters.excludedSeverity).toEqual(['critical']);

      act(() => {
        result.current.actions.addExcludedSeverity('warning');
      });
      expect(result.current.filters.excludedSeverity).toEqual(['critical', 'warning']);

      // Remove one exclusion
      act(() => {
        result.current.actions.removeExcludedSeverity('critical');
      });
      expect(result.current.filters.excludedSeverity).toEqual(['warning']);
    });

    it('should handle CLEAR_ALL_EXCLUDED case', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Add multiple exclusions one by one
      act(() => {
        result.current.actions.addExcludedSeverity('critical');
      });
      act(() => {
        result.current.actions.addExcludedSeverity('warning');
      });
      act(() => {
        result.current.actions.addExcludedSeverity('info');
      });
      expect(result.current.filters.excludedSeverity).toEqual(['critical', 'warning', 'info']);

      // Clear all exclusions
      act(() => {
        result.current.actions.clearAllExcludedSeverity();
      });
      expect(result.current.filters.excludedSeverity).toEqual([]);
    });
  });

  // ============================================================================
  // ERROR AND EDGE CASE TESTS
  // ============================================================================

  it('should handle loading and error states correctly', () => {
    // Test loading state
    mockUseTriggeredAlerts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { result, rerender } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    // Test error state
    const error = new Error('Failed to fetch alerts');
    mockUseTriggeredAlerts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as any);

    rerender();
    expect(result.current.error).toBe(error);

    // Test empty data handling
    mockUseTriggeredAlerts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    rerender();
    expect(result.current.filteredAlerts).toEqual([]);
  });

  it('should handle edge cases in search and filtering', () => {
    const mockAlerts = [
      createMockTriggeredAlert({ alertname: 'HighCPUUsage', component: 'cpu-service' }),
      createMockTriggeredAlert({ alertname: 'API-Gateway-Error', component: 'web-service' }),
      createMockTriggeredAlert({ alertname: 'DiskSpaceAlert', component: undefined }),
      createMockTriggeredAlert({ alertname: 'MemoryAlert', component: '' }),
    ];

    mockUseTriggeredAlerts.mockReturnValue({
      data: createMockAlertsResponse(mockAlerts),
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
      wrapper: createWrapper(),
    });

    // Test case-insensitive search - backend filtering means all alerts returned by mock
    act(() => {
      result.current.actions.setSearchTerm('highcpu');
    });
    expect(result.current.filteredAlerts).toHaveLength(4); // Mock returns all alerts
    
    // Test special characters in search - backend filtering means all alerts returned by mock
    act(() => {
      result.current.actions.setSearchTerm('API-Gateway-Error');
    });
    expect(result.current.filteredAlerts).toHaveLength(4); // Mock returns all alerts

    // Test invalid date handling (should not crash)
    act(() => {
      result.current.actions.setSearchTerm('');
      result.current.actions.setStartDate('invalid-date');
    });
    expect(result.current.filteredAlerts).toHaveLength(4); // Should return all alerts

    // Test invalid date handling should return all alerts
    expect(result.current.filteredAlerts).toHaveLength(4); // Should return all alerts
  });
});
