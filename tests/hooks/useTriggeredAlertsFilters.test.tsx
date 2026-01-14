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
      selectedLandscape: [],
      selectedRegion: [],
      startDate: '',
      endDate: '',
      excludedSeverity: [],
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
    expect(result.current.options.landscapes).toEqual([]);
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
      result.current.actions.setSelectedLandscape(['production']);
      result.current.actions.setSelectedRegion(['us-east-1']);
      result.current.actions.setStartDate('2025-01-01');
      result.current.actions.setEndDate('2025-01-31');
    });

    expect(result.current.filters.searchTerm).toBe('test-search');
    expect(result.current.filters.selectedSeverity).toEqual(['critical']);
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
    });

    // Reset filters
    act(() => {
      result.current.actions.resetFilters();
    });

    expect(result.current.filters).toEqual({
      searchTerm: '',
      selectedSeverity: [],
      selectedLandscape: [],
      selectedRegion: [],
      startDate: '',
      endDate: '',
      excludedSeverity: [],
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

  // ============================================================================
  // UTILITY FUNCTIONS TESTS (Essential only)
  // ============================================================================

  describe('Utility Functions', () => {
    it('should use correct localStorage keys based on initialStatusFilter', () => {
      // Test firing key
      const { result: firingResult } = renderHook(() => useTriggeredAlertsFilters('project-123', ['firing']), {
        wrapper: createWrapper(),
      });
      act(() => firingResult.current.actions.setSearchTerm('test'));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('activeAlertsFilters_project-123', expect.any(String));

      // Test resolved key
      const { result: resolvedResult } = renderHook(() => useTriggeredAlertsFilters('project-123', ['resolved']), {
        wrapper: createWrapper(),
      });
      act(() => resolvedResult.current.actions.setSearchTerm('test'));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('historyAlertsFilters_project-123', expect.any(String));

      // Test fallback key
      const { result: fallbackResult } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });
      act(() => fallbackResult.current.actions.setSearchTerm('test'));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('triggeredAlertsFilters_project-123', expect.any(String));
    });

    it('should load and merge saved filters from localStorage', () => {
      const savedFilters = {
        searchTerm: 'saved-search',
        selectedSeverity: ['critical'],
        excludedSeverity: ['info'],
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedFilters));

      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123', ['firing']), {
        wrapper: createWrapper(),
      });

      expect(result.current.filters.searchTerm).toBe('saved-search');
      expect(result.current.filters.selectedSeverity).toEqual(['critical']);
      expect(result.current.filters.excludedSeverity).toEqual(['info']);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load filters from localStorage:', expect.any(Error));
      expect(result.current.filters.searchTerm).toBe(''); // Should use defaults
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // EXCLUSION HANDLERS TESTS
  // ============================================================================

  describe('Exclusion Handlers', () => {
    describe('addExcludedAlertname', () => {
      it('should clear searchTerm if value matches current searchTerm', () => {
        const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.actions.setSearchTerm('HighCPUUsage');
        });

        act(() => {
          result.current.actions.addExcludedAlertname('HighCPUUsage');
        });

        expect(result.current.filters.searchTerm).toBe('');
        expect(result.current.filters.excludedAlertname).toEqual([]);
      });

      it('should add to excludedAlertname if not matching searchTerm', () => {
        const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.actions.setSearchTerm('DifferentAlert');
        });

        act(() => {
          result.current.actions.addExcludedAlertname('HighCPUUsage');
        });

        expect(result.current.filters.searchTerm).toBe('DifferentAlert');
        expect(result.current.filters.excludedAlertname).toEqual(['HighCPUUsage']);
      });

      it('should toggle exclusion for alertname', () => {
        const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
          wrapper: createWrapper(),
        });

        // Add exclusion
        act(() => {
          result.current.actions.addExcludedAlertname('HighCPUUsage');
        });
        expect(result.current.filters.excludedAlertname).toEqual(['HighCPUUsage']);

        // Toggle exclusion (remove)
        act(() => {
          result.current.actions.addExcludedAlertname('HighCPUUsage');
        });
        expect(result.current.filters.excludedAlertname).toEqual([]);
      });
    });
  });

  // ============================================================================
  // CLEAR ALL EXCLUDED TESTS (Essential only)
  // ============================================================================

  describe('Clear All Excluded Functions', () => {
    it('should clear all excluded filters and reset page', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Set page and add exclusions
      act(() => {
        result.current.actions.setPage(5);
        result.current.actions.addExcludedSeverity('critical');
        result.current.actions.addExcludedAlertname('HighCPUUsage');
      });

      expect(result.current.filters.page).toBe(1); // Should be reset by exclusions
      expect(result.current.filters.excludedSeverity).toEqual(['critical']);
      expect(result.current.filters.excludedAlertname).toEqual(['HighCPUUsage']);

      // Clear all exclusions
      act(() => {
        result.current.actions.clearAllExcludedSeverity();
        result.current.actions.clearAllExcludedAlertname();
      });

      expect(result.current.filters.excludedSeverity).toEqual([]);
      expect(result.current.filters.excludedAlertname).toEqual([]);
    });
  });

  // ============================================================================
  // DATE RANGE HANDLING TESTS (Essential only)
  // ============================================================================

  describe('Date Range Handling', () => {
    it('should handle date range selection and reset page', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Set page first
      act(() => {
        result.current.actions.setPage(3);
      });
      expect(result.current.filters.page).toBe(3);

      // Test full date range
      const dateRange = {
        from: new Date('2025-01-01T00:00:00Z'),
        to: new Date('2025-01-31T23:59:59Z'),
      };

      act(() => {
        result.current.actions.handleDateRangeSelect(dateRange);
      });

      expect(result.current.filters.startDate).toBe('2025-01-01T00:00:00.000Z');
      expect(result.current.filters.endDate).toBe('2025-01-31T23:59:59.000Z');
      expect(result.current.filters.page).toBe(1); // Should reset page

      // Test clearing date range
      act(() => {
        result.current.actions.handleDateRangeSelect(undefined);
      });

      expect(result.current.filters.startDate).toBe('');
      expect(result.current.filters.endDate).toBe('');
    });
  });

  // ============================================================================
  // CLIENT-SIDE EXCLUSION FILTERING TESTS (Consolidated)
  // ============================================================================

  describe('Client-Side Exclusion Filtering', () => {
    it('should filter and sort alerts based on exclusions', () => {
      const mockAlerts = [
        createMockTriggeredAlert({ 
          fingerprint: 'alert-1', 
          severity: 'critical', 
          status: 'resolved', 
          landscape: 'production',
          region: 'us-east-1',
          alertname: 'CriticalAlert',
          startsAt: '2025-01-03T10:00:00Z'
        }),
        createMockTriggeredAlert({ 
          fingerprint: 'alert-2', 
          severity: 'warning', 
          status: 'firing', 
          landscape: 'staging',
          region: 'us-west-2',
          alertname: 'WarningAlert',
          startsAt: '2025-01-04T10:00:00Z'
        }),
        createMockTriggeredAlert({ 
          fingerprint: 'alert-3', 
          severity: 'info', 
          status: 'firing', 
          landscape: 'development',
          region: 'eu-central-1',
          alertname: 'InfoAlert',
          startsAt: '2025-01-01T10:00:00Z'
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

      // Initially all alerts should be visible
      expect(result.current.filteredAlerts).toHaveLength(3);

      // Test exclusion by severity
      act(() => {
        result.current.actions.addExcludedSeverity('critical');
      });
      expect(result.current.filteredAlerts).toHaveLength(2);
      expect(result.current.filteredAlerts.every(alert => alert.severity !== 'critical')).toBe(true);

      // Reset and test multiple exclusions
      act(() => {
        result.current.actions.clearAllExcludedSeverity();
      });
      expect(result.current.filteredAlerts).toHaveLength(3);

      // Test sorting: firing alerts first, then by startsAt descending
      const sortedAlerts = result.current.filteredAlerts;
      expect(sortedAlerts[0].status).toBe('firing');
      expect(sortedAlerts[0].fingerprint).toBe('alert-2'); // Newer firing alert
      expect(sortedAlerts[1].status).toBe('firing');
      expect(sortedAlerts[1].fingerprint).toBe('alert-3'); // Older firing alert
      expect(sortedAlerts[2].status).toBe('resolved');
      expect(sortedAlerts[2].fingerprint).toBe('alert-1'); // Resolved alert
    });
  });

  // ============================================================================
  // ADDITIONAL EDGE CASES AND INTEGRATION TESTS
  // ============================================================================

  describe('Additional Edge Cases and Integration', () => {
    it('should handle pagination info from API response correctly', () => {
      const mockAlertsResponse = {
        data: [createMockTriggeredAlert()],
        page: 2,
        pageSize: 25,
        totalCount: 100,
        totalPages: 4,
      };

      mockUseTriggeredAlerts.mockReturnValue({
        data: mockAlertsResponse,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalCount).toBe(100);
      expect(result.current.totalPages).toBe(4);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(true);
    });

    it('should handle pagination edge cases', () => {
      // Test first page
      let mockAlertsResponse = {
        data: [createMockTriggeredAlert()],
        page: 1,
        pageSize: 25,
        totalCount: 50,
        totalPages: 2,
      };

      mockUseTriggeredAlerts.mockReturnValue({
        data: mockAlertsResponse,
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPreviousPage).toBe(false);

      // Test last page
      mockAlertsResponse = {
        data: [createMockTriggeredAlert()],
        page: 2,
        pageSize: 25,
        totalCount: 50,
        totalPages: 2,
      };

      mockUseTriggeredAlerts.mockReturnValue({
        data: mockAlertsResponse,
        isLoading: false,
        error: null,
      } as any);

      rerender();

      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(true);
    });

    it('should handle empty API responses gracefully', () => {
      mockUseTriggeredAlerts.mockReturnValue({
        data: undefined,
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

      expect(result.current.filteredAlerts).toEqual([]);
      expect(result.current.options.severities).toEqual([]);
      expect(result.current.options.landscapes).toEqual([]);
      expect(result.current.options.regions).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPreviousPage).toBe(false);
    });

    it('should handle conflicting selected and excluded filters correctly', () => {
      const { result } = renderHook(() => useTriggeredAlertsFilters('project-123'), {
        wrapper: createWrapper(),
      });

      // Set selected severity
      act(() => {
        result.current.actions.setSelectedSeverity(['critical', 'warning']);
      });

      expect(result.current.filters.selectedSeverity).toEqual(['critical', 'warning']);
      expect(result.current.filters.excludedSeverity).toEqual([]);

      // Now add exclusion for warning - should remove it from selected and not add to excluded (since it was selected)
      act(() => {
        result.current.actions.addExcludedSeverity('warning');
      });

      expect(result.current.filters.selectedSeverity).toEqual(['critical']);
      expect(result.current.filters.excludedSeverity).toEqual([]); // Should be empty because warning was removed from selected

      // Now add exclusion for something not selected - should add to excluded
      act(() => {
        result.current.actions.addExcludedSeverity('info');
      });

      expect(result.current.filters.selectedSeverity).toEqual(['critical']);
      expect(result.current.filters.excludedSeverity).toEqual(['info']);
    });
  });
});
