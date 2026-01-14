import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactNode } from 'react';
import { TriggeredAlertsProvider, useTriggeredAlertsContext } from '../../src/contexts/TriggeredAlertsContext';
import type { TriggeredAlert } from '../../src/types/api';
import { useTriggeredAlertsFilters } from '../../src/hooks/useTriggeredAlertsFilters';

// Mock the useTriggeredAlertsFilters hook
vi.mock('../../src/hooks/useTriggeredAlertsFilters', () => ({
  useTriggeredAlertsFilters: vi.fn(),
}));

const mockUseTriggeredAlertsFilters = vi.mocked(useTriggeredAlertsFilters);

// Mock data
const mockTriggeredAlert: TriggeredAlert = {
  fingerprint: '1',
  alertname: 'Test Alert',
  component: 'test-component',
  severity: 'critical',
  status: 'firing',
  landscape: 'production',
  region: 'us-east-1',
  startsAt: '2023-12-01T10:00:00Z',
  endsAt: undefined,
  labels: {},
  annotations: {},
  createdAt: '2023-12-01T10:00:00Z',
  updatedAt: '2023-12-01T10:00:00Z',
};

const mockFiltersData = {
  filters: {
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
  },
  actions: {
    setSearchTerm: vi.fn(),
    setSelectedSeverity: vi.fn(),
    setSelectedLandscape: vi.fn(),
    setSelectedRegion: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    addExcludedSeverity: vi.fn(),
    addExcludedLandscape: vi.fn(),
    addExcludedRegion: vi.fn(),
    addExcludedAlertname: vi.fn(),
    handleDateRangeSelect: vi.fn(),
    resetFilters: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    removeSearchTerm: vi.fn(),
    removeSeverity: vi.fn(),
    removeLandscape: vi.fn(),
    removeRegion: vi.fn(),
    removeDateRange: vi.fn(),
    removeExcludedSeverity: vi.fn(),
    removeExcludedLandscape: vi.fn(),
    removeExcludedRegion: vi.fn(),
    removeExcludedAlertname: vi.fn(),
    clearAllExcludedSeverity: vi.fn(),
    clearAllExcludedLandscape: vi.fn(),
    clearAllExcludedRegion: vi.fn(),
    clearAllExcludedAlertname: vi.fn(),
  },
  options: {
    severities: ['critical', 'warning', 'info'],
    landscapes: ['production', 'staging'],
    regions: ['us-east-1', 'eu-west-1'],
  },
  filteredAlerts: [mockTriggeredAlert],
  isLoading: false,
  filtersLoading: false,
  error: null,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

// Test component to access context
const TestComponent = () => {
  const context = useTriggeredAlertsContext();
  
  return (
    <div>
      <div data-testid="filters-search">{context.filters.searchTerm}</div>
      <div data-testid="filters-severity">{context.filters.selectedSeverity}</div>
      <div data-testid="filters-landscape">{context.filters.selectedLandscape}</div>
      <div data-testid="filters-region">{context.filters.selectedRegion}</div>
      <div data-testid="filters-start-date">{context.filters.startDate}</div>
      <div data-testid="filters-end-date">{context.filters.endDate}</div>
      <div data-testid="options-severities">{context.options.severities.join(',')}</div>
      <div data-testid="options-landscapes">{context.options.landscapes.join(',')}</div>
      <div data-testid="options-regions">{context.options.regions.join(',')}</div>
      <div data-testid="filtered-alerts-count">{context.filteredAlerts.length}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
      <div data-testid="filters-loading">{context.filtersLoading.toString()}</div>
      <div data-testid="error">{context.error?.message || 'null'}</div>
      <div data-testid="applied-filters-count">{context.appliedFilters.length}</div>
      <button data-testid="search-action" onClick={() => context.actions.setSearchTerm('test')}>
        Set Search
      </button>
      <button data-testid="severity-action" onClick={() => context.actions.setSelectedSeverity('critical')}>
        Set Severity
      </button>
      <button data-testid="remove-search" onClick={() => context.actions.removeSearchTerm()}>
        Remove Search
      </button>
    </div>
  );
};

describe('TriggeredAlertsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTriggeredAlertsFilters.mockReturnValue(mockFiltersData);
  });

  const renderWithProvider = (children: ReactNode, projectId = 'test-project') => {
    return render(
      <TriggeredAlertsProvider projectId={projectId}>
        {children}
      </TriggeredAlertsProvider>
    );
  };

  describe('TriggeredAlertsProvider', () => {
    it('should provide complete context functionality', () => {
      renderWithProvider(<TestComponent />);

      // Verify filter state
      expect(screen.getByTestId('filters-search')).toHaveTextContent('');
      expect(screen.getByTestId('filters-severity')).toHaveTextContent('');

      // Verify filter options
      expect(screen.getByTestId('options-severities')).toHaveTextContent('critical,warning,info');
      expect(screen.getByTestId('options-landscapes')).toHaveTextContent('production,staging');

      // Verify data and loading states
      expect(screen.getByTestId('filtered-alerts-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should call useTriggeredAlertsFilters with correct projectId and handle actions', async () => {
      renderWithProvider(<TestComponent />, 'custom-project-id');

      expect(mockUseTriggeredAlertsFilters).toHaveBeenCalledWith('custom-project-id', undefined);

      // Test action functions
      const searchButton = screen.getByTestId('search-action');
      const removeSearchButton = screen.getByTestId('remove-search');

      searchButton.click();
      removeSearchButton.click();

      expect(mockFiltersData.actions.setSearchTerm).toHaveBeenCalledWith('test');
      expect(mockFiltersData.actions.removeSearchTerm).toHaveBeenCalled();
    });
  });

  describe('Applied Filters Logic', () => {
    it('should generate no applied filters when all filters are default', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('0');
    });

    it('should generate applied filter for search term', () => {
      const filtersWithSearch = {
        ...mockFiltersData,
        filters: { ...mockFiltersData.filters, searchTerm: 'test search' },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithSearch);
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('1');
    });

    it('should generate applied filter for severity', () => {
      const filtersWithSeverity = {
        ...mockFiltersData,
        filters: { ...mockFiltersData.filters, selectedSeverity: ['critical'] },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithSeverity);
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('1');
    });

    it('should generate applied filter for date range', () => {
      const filtersWithDateRange = {
        ...mockFiltersData,
        filters: { ...mockFiltersData.filters, startDate: '2023-12-01', endDate: '2023-12-31' },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithDateRange);
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('1');
    });

    it('should generate multiple applied filters when multiple filters are set', () => {
      const filtersWithMultiple = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          searchTerm: 'test',
          selectedSeverity: ['critical'],
          startDate: '2023-12-01',
          endDate: '2023-12-31',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithMultiple);
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('3');
    });

    it('should not generate applied filters for empty arrays', () => {
      const filtersWithEmptyArrays = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          selectedSeverity: [],
          selectedStatus: [],
          selectedLandscape: [],
          selectedRegion: [],
          selectedComponent: [],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithEmptyArrays);
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('0');
    });
  });

  describe('Applied Filters Structure', () => {
    it('should create applied filters with correct structure', () => {
      const TestComponentWithAppliedFilters = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <div key={filter.key} data-testid={`applied-filter-${index}`}>
                <span data-testid={`filter-key-${index}`}>{filter.key}</span>
                <span data-testid={`filter-label-${index}`}>{filter.label}</span>
                <button data-testid={`filter-remove-${index}`} onClick={filter.onRemove}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      };

      const filtersWithSearch = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          searchTerm: 'test search',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithSearch);

      renderWithProvider(<TestComponentWithAppliedFilters />);

      expect(screen.getByTestId('filter-key-0')).toHaveTextContent('search');
      expect(screen.getByTestId('filter-label-0')).toHaveTextContent('Search: "test search"');
      
      const removeButton = screen.getByTestId('filter-remove-0');
      removeButton.click();
      expect(mockFiltersData.actions.removeSearchTerm).toHaveBeenCalled();
    });

    it('should format date labels correctly', () => {
      const TestComponentWithDateFilter = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <div key={filter.key} data-testid={`applied-filter-${index}`}>
                <span data-testid={`filter-label-${index}`}>{filter.label}</span>
              </div>
            ))}
          </div>
        );
      };

      const filtersWithDateRange = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          startDate: '2023-12-01',
          endDate: '2023-12-31',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithDateRange);

      renderWithProvider(<TestComponentWithDateFilter />);

      expect(screen.getByTestId('filter-label-0')).toHaveTextContent('Date: 01/12/2023 - 31/12/2023');
    });
  });

  describe('Error Handling', () => {
    it('should handle error state from useTriggeredAlertsFilters', () => {
      const filtersWithError = {
        ...mockFiltersData,
        error: new Error('Test error'),
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithError);

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });

    it('should handle loading states', () => {
      const filtersWithLoading = {
        ...mockFiltersData,
        isLoading: true,
        filtersLoading: true,
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithLoading);

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
      expect(screen.getByTestId('filters-loading')).toHaveTextContent('true');
    });
  });

  describe('useTriggeredAlertsContext', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTriggeredAlertsContext must be used within a TriggeredAlertsProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide all required context values', () => {
      renderWithProvider(<TestComponent />);

      // Verify all required properties are accessible
      expect(screen.getByTestId('filters-search')).toBeInTheDocument();
      expect(screen.getByTestId('options-severities')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-alerts-count')).toBeInTheDocument();
      expect(screen.getByTestId('is-loading')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('applied-filters-count')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should memoize applied filters correctly', () => {
      const { rerender } = renderWithProvider(<TestComponent />);

      // Initial render
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('0');

      // Re-render with same data should not change applied filters
      rerender(
        <TriggeredAlertsProvider projectId="test-project">
          <TestComponent />
        </TriggeredAlertsProvider>
      );

      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('0');
    });

    it('should update applied filters when filter values change', () => {
      const { rerender } = renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('0');

      // Update mock to return filters with search term
      const filtersWithSearch = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          searchTerm: 'test',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithSearch);

      rerender(
        <TriggeredAlertsProvider projectId="test-project">
          <TestComponent />
        </TriggeredAlertsProvider>
      );

      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('1');
    });
  });

  describe('Filter Actions', () => {
    it('should handle key filter actions', () => {
      const TestActionsComponent = () => {
        const { actions } = useTriggeredAlertsContext();
        
        return (
          <div>
            <button data-testid="set-search" onClick={() => actions.setSearchTerm('test search')}>Set Search</button>
            <button data-testid="set-severity" onClick={() => actions.setSelectedSeverity(['critical'])}>Set Severity</button>
            <button data-testid="handle-date-range" onClick={() => actions.handleDateRangeSelect('2023-12-01', '2023-12-31')}>Handle Date Range</button>
            <button data-testid="reset-filters" onClick={() => actions.resetFilters()}>Reset Filters</button>
            <button data-testid="remove-search" onClick={() => actions.removeSearchTerm()}>Remove Search</button>
            <button data-testid="add-excluded-severity" onClick={() => actions.addExcludedSeverity('warning')}>Add Excluded Severity</button>
            <button data-testid="remove-excluded-severity" onClick={() => actions.removeExcludedSeverity('warning')}>Remove Excluded Severity</button>
            <button data-testid="clear-excluded-severity" onClick={() => actions.clearAllExcludedSeverity()}>Clear All Excluded Severity</button>
          </div>
        );
      };

      renderWithProvider(<TestActionsComponent />);

      // Test key actions
      screen.getByTestId('set-search').click();
      expect(mockFiltersData.actions.setSearchTerm).toHaveBeenCalledWith('test search');

      screen.getByTestId('set-severity').click();
      expect(mockFiltersData.actions.setSelectedSeverity).toHaveBeenCalledWith(['critical']);

      screen.getByTestId('handle-date-range').click();
      expect(mockFiltersData.actions.handleDateRangeSelect).toHaveBeenCalledWith('2023-12-01', '2023-12-31');

      screen.getByTestId('reset-filters').click();
      expect(mockFiltersData.actions.resetFilters).toHaveBeenCalled();

      screen.getByTestId('remove-search').click();
      expect(mockFiltersData.actions.removeSearchTerm).toHaveBeenCalled();

      screen.getByTestId('add-excluded-severity').click();
      expect(mockFiltersData.actions.addExcludedSeverity).toHaveBeenCalledWith('warning');

      screen.getByTestId('remove-excluded-severity').click();
      expect(mockFiltersData.actions.removeExcludedSeverity).toHaveBeenCalledWith('warning');

      screen.getByTestId('clear-excluded-severity').click();
      expect(mockFiltersData.actions.clearAllExcludedSeverity).toHaveBeenCalled();
    });
  });

  describe('Excluded Filters Applied Logic', () => {
    it('should generate applied filters for excluded filters', () => {
      const filtersWithExcluded = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          excludedSeverity: ['warning', 'info'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithExcluded);

      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('2');
    });

    it('should create excluded applied filters with correct structure and isExclusion flag', () => {
      const TestExcludedFiltersComponent = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <div key={filter.key} data-testid={`applied-filter-${index}`}>
                <span data-testid={`filter-key-${index}`}>{filter.key}</span>
                <span data-testid={`filter-label-${index}`}>{filter.label}</span>
                <span data-testid={`filter-exclusion-${index}`}>{filter.isExclusion ? 'true' : 'false'}</span>
                <button data-testid={`filter-remove-${index}`} onClick={filter.onRemove}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      };

      const filtersWithExcluded = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          excludedSeverity: ['warning'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithExcluded);

      renderWithProvider(<TestExcludedFiltersComponent />);

      expect(screen.getByTestId('filter-key-0')).toHaveTextContent('excludedSeverity-0');
      expect(screen.getByTestId('filter-label-0')).toHaveTextContent('Not: warning');
      expect(screen.getByTestId('filter-exclusion-0')).toHaveTextContent('true');
      
      const removeButton = screen.getByTestId('filter-remove-0');
      removeButton.click();
      expect(mockFiltersData.actions.removeExcludedSeverity).toHaveBeenCalledWith('warning');
    });

    it('should generate applied filters for all excluded filter types', () => {
      const filtersWithAllExcluded = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          excludedLandscape: ['production'],
          excludedRegion: ['us-east-1'],
          excludedAlertname: ['Test Alert'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithAllExcluded);

      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('3');
    });

    it('should handle excluded filter removal actions for all types', () => {
      const TestAllExcludedFiltersComponent = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <button key={filter.key} data-testid={`remove-excluded-${index}`} onClick={filter.onRemove}>
                Remove {filter.label}
              </button>
            ))}
          </div>
        );
      };

      const filtersWithAllExcluded = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          excludedLandscape: ['production'],
          excludedRegion: ['us-east-1'],
          excludedAlertname: ['Test Alert'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithAllExcluded);

      renderWithProvider(<TestAllExcludedFiltersComponent />);

      // Test excluded landscape removal
      screen.getByTestId('remove-excluded-0').click();
      expect(mockFiltersData.actions.removeExcludedLandscape).toHaveBeenCalledWith('production');

      // Test excluded region removal
      screen.getByTestId('remove-excluded-1').click();
      expect(mockFiltersData.actions.removeExcludedRegion).toHaveBeenCalledWith('us-east-1');

      // Test excluded alertname removal
      screen.getByTestId('remove-excluded-2').click();
      expect(mockFiltersData.actions.removeExcludedAlertname).toHaveBeenCalledWith('Test Alert');
    });
  });

  describe('Complete Filter Coverage', () => {
    it('should generate applied filters for all standard filter types', () => {
      const filtersWithAll = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          selectedLandscape: ['production', 'staging'],
          selectedRegion: ['us-east-1', 'eu-west-1'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithAll);

      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('4');
    });

    it('should handle removal actions for all standard filter types', () => {
      const TestAllFiltersComponent = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <button key={filter.key} data-testid={`remove-filter-${index}`} onClick={filter.onRemove}>
                Remove {filter.label}
              </button>
            ))}
          </div>
        );
      };

      const filtersWithAll = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          selectedLandscape: ['production'],
          selectedRegion: ['us-east-1'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithAll);

      renderWithProvider(<TestAllFiltersComponent />);

      // Test landscape removal
      screen.getByTestId('remove-filter-0').click();
      expect(mockFiltersData.actions.setSelectedLandscape).toHaveBeenCalledWith([]);

      // Test region removal
      screen.getByTestId('remove-filter-1').click();
      expect(mockFiltersData.actions.setSelectedRegion).toHaveBeenCalledWith([]);
    });
  });

  describe('Date Range Formatting Edge Cases', () => {
    it('should format date range with only start date', () => {
      const TestDateFilterComponent = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <div key={filter.key} data-testid={`applied-filter-${index}`}>
                <span data-testid={`filter-label-${index}`}>{filter.label}</span>
              </div>
            ))}
          </div>
        );
      };

      const filtersWithStartDateOnly = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          startDate: '2023-12-01',
          endDate: '',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithStartDateOnly);

      renderWithProvider(<TestDateFilterComponent />);

      expect(screen.getByTestId('filter-label-0')).toHaveTextContent('Date: From 01/12/2023');
    });

    it('should format date range with only end date', () => {
      const TestDateFilterComponent = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <div key={filter.key} data-testid={`applied-filter-${index}`}>
                <span data-testid={`filter-label-${index}`}>{filter.label}</span>
              </div>
            ))}
          </div>
        );
      };

      const filtersWithEndDateOnly = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          startDate: '',
          endDate: '2023-12-31',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithEndDateOnly);

      renderWithProvider(<TestDateFilterComponent />);

      expect(screen.getByTestId('filter-label-0')).toHaveTextContent('Date: Until 31/12/2023');
    });

    it('should handle invalid date strings gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const filtersWithInvalidDate = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          startDate: 'invalid-date',
          endDate: '2023-12-31',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithInvalidDate);

      renderWithProvider(<TestComponent />);

      // Should still create an applied filter even with invalid date
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Applied Filters Remove Actions', () => {
    it('should handle removing individual filters from arrays', () => {
      const TestRemoveComponent = () => {
        const { appliedFilters } = useTriggeredAlertsContext();
        
        return (
          <div>
            {appliedFilters.map((filter, index) => (
              <button key={filter.key} data-testid={`remove-${index}`} onClick={filter.onRemove}>
                Remove {filter.label}
              </button>
            ))}
          </div>
        );
      };

      const filtersWithMultiple = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          selectedSeverity: ['critical', 'warning'],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithMultiple);

      renderWithProvider(<TestRemoveComponent />);

      // Test removing from severity array
      screen.getByTestId('remove-0').click();
      expect(mockFiltersData.actions.setSelectedSeverity).toHaveBeenCalledWith(['warning']);
    });
  });

  describe('Provider Props', () => {
    it('should pass projectId to context', () => {
      const TestProjectIdComponent = () => {
        const { projectId } = useTriggeredAlertsContext();
        return <div data-testid="project-id">{projectId}</div>;
      };

      renderWithProvider(<TestProjectIdComponent />, 'custom-project-123');

      expect(screen.getByTestId('project-id')).toHaveTextContent('custom-project-123');
    });

    it('should pass onShowAlertDefinition callback to context', () => {
      const mockOnShowAlertDefinition = vi.fn();
      
      const TestCallbackComponent = () => {
        const { onShowAlertDefinition } = useTriggeredAlertsContext();
        return (
          <button 
            data-testid="show-alert-definition" 
            onClick={() => onShowAlertDefinition?.('Test Alert')}
          >
            Show Alert Definition
          </button>
        );
      };

      render(
        <TriggeredAlertsProvider projectId="test-project" onShowAlertDefinition={mockOnShowAlertDefinition}>
          <TestCallbackComponent />
        </TriggeredAlertsProvider>
      );

      screen.getByTestId('show-alert-definition').click();
      expect(mockOnShowAlertDefinition).toHaveBeenCalledWith('Test Alert');
    });

    it('should handle undefined onShowAlertDefinition callback', () => {
      const TestCallbackComponent = () => {
        const { onShowAlertDefinition } = useTriggeredAlertsContext();
        return (
          <div>
            <div data-testid="callback-exists">{onShowAlertDefinition ? 'true' : 'false'}</div>
            <button 
              data-testid="show-alert-definition" 
              onClick={() => onShowAlertDefinition?.('Test Alert')}
            >
              Show Alert Definition
            </button>
          </div>
        );
      };

      renderWithProvider(<TestCallbackComponent />);

      expect(screen.getByTestId('callback-exists')).toHaveTextContent('false');
      
      // Should not throw when callback is undefined
      expect(() => {
        screen.getByTestId('show-alert-definition').click();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter options', () => {
      const filtersWithEmptyOptions = {
        ...mockFiltersData,
        options: {
          severities: [],
          landscapes: [],
          regions: [],
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithEmptyOptions);

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('options-severities')).toHaveTextContent('');
      expect(screen.getByTestId('options-landscapes')).toHaveTextContent('');
      expect(screen.getByTestId('options-regions')).toHaveTextContent('');
    });

    it('should handle empty filtered alerts', () => {
      const filtersWithEmptyAlerts = {
        ...mockFiltersData,
        filteredAlerts: [],
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithEmptyAlerts);

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('filtered-alerts-count')).toHaveTextContent('0');
    });

    it('should handle null error state', () => {
      const filtersWithNullError = {
        ...mockFiltersData,
        error: null,
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithNullError);

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should handle non-array excluded filters gracefully', () => {
      const filtersWithNonArrayExcluded = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          excludedSeverity: null as any,
          excludedStatus: undefined as any,
          excludedLandscape: 'not-an-array' as any,
        },
      } as any;
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithNonArrayExcluded);

      renderWithProvider(<TestComponent />);

      // Should not crash and should have no applied filters
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('0');
    });

    it('should handle mixed filter types correctly', () => {
      const filtersWithMixed = {
        ...mockFiltersData,
        filters: {
          ...mockFiltersData.filters,
          searchTerm: 'test',
          selectedSeverity: ['critical'],
          excludedStatus: ['resolved'],
          startDate: '2023-12-01',
          endDate: '2023-12-31',
        },
      };
      mockUseTriggeredAlertsFilters.mockReturnValue(filtersWithMixed);

      renderWithProvider(<TestComponent />);

      // Should have 3 applied filters: search, severity, date range (excludedStatus doesn't exist in our mock)
      expect(screen.getByTestId('applied-filters-count')).toHaveTextContent('3');
    });
  });
});
